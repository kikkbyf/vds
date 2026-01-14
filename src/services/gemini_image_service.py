import base64
import logging
import mimetypes
import os
import json
import requests
import time
from typing import Union, List, Dict, Any

from google import genai
from google.genai import types
import google.auth
from google.auth.transport.requests import Request as GoogleAuthRequest

from src.interface.types.external_types import (
    GeminiBananaProImageOutput,
    GeminiBananaProImageToImageInput,
    GeminiBananaProTextToImageInput,
)

logger = logging.getLogger(__name__)

# Default model configuration
_DEFAULT_MODEL = "gemini-3-pro-image-preview"
_DEFAULT_LOCATION = "global"

class GeminiImageService:
    def __init__(self) -> None:
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        # Ensure we use global location as discovered
        self.location = "global" 
        self.model = _DEFAULT_MODEL
        
        # We still keep genai client for utility or simple calls if needed, 
        # but principal generation will use raw requests.
        self.client = genai.Client(vertexai=True, project=self.project_id, location=self.location)

    def _get_headers(self) -> Dict[str, str]:
        """Get authenticated headers for raw request."""
        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        creds, _ = google.auth.default(scopes=scopes)
        if not creds.valid:
            creds.refresh(GoogleAuthRequest())
        return {
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json; charset=utf-8"
        }

    def _construct_part_dict(self, image_input: Union[str, bytes]) -> Dict[str, Any]:
        """Convert image input to raw API part dictionary (camelCase)."""
        mime_type = "image/png"
        data_b64 = ""

        if isinstance(image_input, bytes):
            mime_type = self._detect_mime_type(image_input)
            data_b64 = base64.b64encode(image_input).decode('utf-8')
        
        elif isinstance(image_input, str):
            if image_input.startswith("data:"):
                header, data = image_input.split(",", 1)
                mime_type = header.split(";", 1)[0].replace("data:", "")
                data_b64 = data # Already base64
            else:
                # Assume url, but for now we only support base64/datauri/bytes for raw flow
                # If it's a real URL, we should use fileData or similar, but app sends base64.
                raise ValueError("Raw request mode requires Base64 Data URI or Bytes")

        return {
            "inlineData": {
                "mimeType": mime_type,
                "data": data_b64
            }
        }

    def _detect_mime_type(self, data: bytes) -> str:
        if data.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if data.startswith(b"\xff\xd8"):
            return "image/jpeg"
        if data.startswith(b"GIF8"):
            return "image/gif"
        if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
            return "image/webp"
        return "image/png"

    async def generate_image_from_image(
        self, input_data: GeminiBananaProImageToImageInput
    ) -> GeminiBananaProImageOutput:
        return await self._run_generation(
            prompt=input_data.prompt,
            images=input_data.image_url,
            aspect_ratio=input_data.ratio.value,
            image_size=input_data.image_size.value
        )

    async def generate_image_from_text(
        self, input_data: GeminiBananaProTextToImageInput
    ) -> GeminiBananaProImageOutput:
        return await self._run_generation(
            prompt=input_data.prompt,
            images=[],
            aspect_ratio=input_data.ratio.value,
            image_size=input_data.image_size.value
        )

    async def _run_generation(self, prompt: str, images: List[Union[str, bytes]], aspect_ratio: str, image_size: str) -> GeminiBananaProImageOutput:
        max_retries = 3
        retry_delay = 2  # base delay in seconds
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Generating image with {self.model} (Native {image_size})... Attempt {attempt + 1}")
                
                # 1. Build Payload
                parts = [{"text": prompt}]
                if images:
                    for img in images:
                        parts.append(self._construct_part_dict(img))
                
                payload = {
                    "contents": [{
                        "role": "user",
                        "parts": parts
                    }],
                    "generationConfig": {
                        "responseModalities": ["IMAGE"],
                        "imageConfig": {
                            "aspectRatio": aspect_ratio,
                            "imageSize": image_size # Native 2K/4K support
                        }
                    }
                }

                # 2. Send Request
                url = f"https://aiplatform.googleapis.com/v1beta1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/{self.model}:generateContent"
                
                response = requests.post(url, headers=self._get_headers(), json=payload, timeout=600)

                if response.status_code == 429:
                    if attempt < max_retries:
                        sleep_time = retry_delay * (2 ** attempt)
                        logger.warning(f"API Rate Limit (429) hit. Retrying in {sleep_time}s... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(sleep_time)
                        continue
                    else:
                        raise ValueError(f"API Error 429: Resource exhausted after {max_retries} retries.")

                if response.status_code != 200:
                    raise ValueError(f"API Error {response.status_code}: {response.text}")

                # 3. Parse Response
                rjson = response.json()
                image_bytes = None
                
                # Navigation: candidates[0].content.parts[0].inlineData.data
                candidates = rjson.get("candidates", [])
                for cand in candidates:
                    content = cand.get("content", {})
                    c_parts = content.get("parts", [])
                    for part in c_parts:
                        inline = part.get("inlineData", {})
                        if "data" in inline:
                            image_bytes = base64.b64decode(inline["data"])
                            break
                    if image_bytes: break

                if not image_bytes:
                    raise ValueError("No image data found in response")

                # Debug: Log assets
                self._log_generation_assets(prompt, images, image_bytes)

                return GeminiBananaProImageOutput(
                    success=True,
                    status=200,
                    image_data=image_bytes,
                    prompt=prompt,
                    model=self.model,
                )

            except Exception as e:
                if attempt < max_retries and "429" in str(e):
                    # Already handled above if it's a direct status_code check, 
                    # but if it comes from an exception, retry here too.
                    continue
                
                logger.exception(f"generation failed on attempt {attempt + 1}")
                if attempt == max_retries:
                    return GeminiBananaProImageOutput(
                        success=False,
                        status=500,
                        prompt=prompt,
                        model=self.model,
                        error=str(e),
                    )
        
        return GeminiBananaProImageOutput(
            success=False,
            status=500,
            prompt=prompt,
            model=self.model,
            error="Unexpected generation failure after retries",
        )

    def _log_generation_assets(self, prompt: str, images: List[Union[str, bytes]], output_bytes: bytes):
        """Debug Utility: Save generation assets to local disk for inspection."""
        try:
            import datetime
            import textwrap

            # 1. Create Timestamped Directory
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            # We sanitize prompt slightly for filename, or just use timestamp
            log_dir = os.path.join(os.getcwd(), "logs", timestamp)
            os.makedirs(log_dir, exist_ok=True)

            logger.info(f"Writing debug assets to {log_dir}")

            # 2. Save Prompt
            with open(os.path.join(log_dir, "prompt.txt"), "w", encoding="utf-8") as f:
                f.write(prompt)

            # 3. Save Input Images
            if images:
                for idx, img in enumerate(images):
                    img_data = b""
                    ext = "png"
                    
                    if isinstance(img, bytes):
                        img_data = img
                        if img.startswith(b"\xff\xd8"): ext = "jpg"
                    elif isinstance(img, str):
                        # Decode base64 if needed
                        if img.startswith("data:"):
                            try:
                                header, encoded = img.split(",", 1)
                                ext = header.split(";", 1)[0].split("/", 1)[1]
                                img_data = base64.b64decode(encoded)
                            except:
                                pass
                        else:
                            # Skip URLs for now or download them? 
                            # User only sends base64/bytes currently.
                            continue
                    
                    if img_data:
                        with open(os.path.join(log_dir, f"input_{idx}.{ext}"), "wb") as f:
                            f.write(img_data)

            # 4. Save Output Image
            if output_bytes:
                with open(os.path.join(log_dir, "output.png"), "wb") as f:
                    f.write(output_bytes)
        
        except Exception as e:
            logger.error(f"Failed to log debug assets: {str(e)}")

