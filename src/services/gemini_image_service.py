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
        self, input_data: GeminiBananaProImageToImageInput, **kwargs
    ) -> GeminiBananaProImageOutput:
        return await self._run_generation(
            prompt=input_data.prompt,
            images=input_data.image_url,
            aspect_ratio=input_data.ratio.value,
            image_size=input_data.image_size.value,
            **kwargs
        )

    async def generate_image_from_text(
        self, input_data: GeminiBananaProTextToImageInput, **kwargs
    ) -> GeminiBananaProImageOutput:
        return await self._run_generation(
            prompt=input_data.prompt,
            images=[],
            aspect_ratio=input_data.ratio.value,
            image_size=input_data.image_size.value,
            **kwargs
        )

    async def _run_generation(self, prompt: str, images: List[Union[str, bytes]], aspect_ratio: str, image_size: str, progress_callback=None) -> GeminiBananaProImageOutput:
        # Retry Strategy: 4s * (2^n) 
        # 0: 4s
        # 1: 8s
        # 2: 16s
        # 3: 32s
        # 4: 64s
        # 5: 128s
        # 6: 256s (4m) ...
        max_retries = 10 
        retry_delay = 4
        
        import asyncio
        import functools

        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Generating image with {self.model} (Native {image_size})... Attempt {attempt + 1}")
                if attempt > 0 and progress_callback:
                    progress_callback(50, f"Generating... (Attempt {attempt + 1}/{max_retries})")
                
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
                            "imageSize": image_size 
                        }
                    }
                }

                # 2. Send Request (Non-blocking)
                url = f"https://aiplatform.googleapis.com/v1beta1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/{self.model}:generateContent"
                
                # Debug: Print payload for troubleshooting
                logger.info(f"[DEBUG] API URL: {url}")
                logger.info(f"[DEBUG] Payload: aspectRatio={aspect_ratio}, imageSize={image_size}, num_images={len(images) if images else 0}")
                
                # Run sync requests in thread pool to avoid blocking asyncio loop
                loop = asyncio.get_running_loop()
                # Reduced timeout to 180s to fail fast
                # But since we are backend async now, we can tolerate longer timeouts if needed, 
                # but standard HTTP request timeout is good.
                call_request = functools.partial(requests.post, url, headers=self._get_headers(), json=payload, timeout=180)
                response = await loop.run_in_executor(None, call_request)

                if response.status_code == 429:
                    raise ValueError(f"API Error 429: Rate limit exceeded")
                
                if response.status_code != 200:
                    raise ValueError(f"API Error {response.status_code}: {response.text}")

                # 3. Parse Response
                rjson = response.json()
                image_bytes = None
                
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

                return GeminiBananaProImageOutput(
                    success=True,
                    status=200,
                    image_data=image_bytes,
                    prompt=prompt,
                    model=self.model,
                )

            except Exception as e:
                is_rate_limit = "429" in str(e) or "Resource exhausted" in str(e) or "Quota exceeded" in str(e)
                is_timeout = "Read timed out" in str(e) or "ConnectTimeout" in str(e) or "TimeoutError" in str(e)
                
                if attempt < max_retries and (is_rate_limit or is_timeout):
                    sleep_time = retry_delay * (2 ** attempt)
                    reason = "API Limit Hit (429)" if is_rate_limit else "Request Timeout"
                    msg = f"{reason}. Retrying in {sleep_time}s... ({attempt + 1}/{max_retries})"
                    logger.warning(msg)
                    
                    if progress_callback:
                        # Allow user to see we are waiting
                        progress_callback(50, f"Waiting... {reason} ({sleep_time}s retry)")
                        
                    # Use async sleep!
                    await asyncio.sleep(sleep_time)
                    continue
                
                # If it's not a retryable error, or we ran out of retries
                if attempt == max_retries or not (is_rate_limit or is_timeout):
                    logger.exception(f"Generation failed on attempt {attempt + 1}: {str(e)}")
                    return GeminiBananaProImageOutput(
                        success=False,
                        status=500,
                        prompt=prompt,
                        model=self.model,
                        error=f"Generation failed: {str(e)}",
                    )
        
        return GeminiBananaProImageOutput(
            success=False,
            status=500,
            prompt=prompt,
            model=self.model,
            error="Unexpected generation failure",
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

