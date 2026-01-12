import os
import mimetypes
import logging
from typing import List, Union
from google import genai
from google.genai import types

from src.interface.types.external_types import (
    GeminiBananaProImageOutput,
    GeminiBananaProImageToImageInput,
    GeminiBananaProTextToImageInput,
)

logger = logging.getLogger(__name__)

# Default model configuration
_DEFAULT_MODEL = "imagen-4.0-generate-001"
_DEFAULT_LOCATION = "us-east4" # Or user provided location if needed

class GeminiImageService:
    def __init__(self):
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", _DEFAULT_LOCATION)
        
        if not project_id:
            logger.warning("GOOGLE_CLOUD_PROJECT environment variable not set. Client may fail.")

        # Initialize Vertex AI client
        self.client = genai.Client(
            vertexai=True,
            project=project_id,
            location=location
        )
        self.model = _DEFAULT_MODEL

    async def generate_image_from_image(
        self, input_data: GeminiBananaProImageToImageInput
    ) -> GeminiBananaProImageOutput:
        try:
            if not input_data.image_url:
                raise ValueError("image_url list cannot be empty")

            original_prompt = input_data.prompt
            image_parts = []
            
            # Process input images
            for img_item in input_data.image_url:
                part = self._get_image_part(img_item)
                image_parts.append(part)

            # Step 1: Analyze the image to get pose description using Gemini Flash
            # Imagen 3 does not support direct image input for generation in standard mode.
            # We use a multimodal model to "see" the pose first.
            analysis_model = "gemini-1.5-flash"
            analysis_prompt = (
                "Analyze the head pose, camera angle, and facial expression of the person in this image. "
                "Describe it in detail so a 3D artist can recreate it. "
                "Focus on head rotation (pitch, yaw, roll) and camera framing."
            )
            
            logger.info(f"Analyzing image pose with {analysis_model}...")
            analysis_response = self.client.models.generate_content(
                model=analysis_model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=analysis_prompt)] + image_parts
                    )
                ]
            )
            
            pose_description = analysis_response.text
            if not pose_description:
                pose_description = "A standard headshot."
            
            logger.info(f"Pose Analysis: {pose_description[:100]}...")

            # Step 2: Generate Image using Imagen 3 with enriched prompt
            # We combine the user's original stylistic prompt with the pose description.
            combined_prompt = f"{original_prompt}\n\nPose and Angle Context: {pose_description}"
            
            logger.info(f"Generating image with {self.model} using generate_images...")
            response = self.client.models.generate_images(
                model=self.model,
                prompt=combined_prompt,
                config=types.GenerateImagesConfig(
                    aspect_ratio=input_data.ratio.value,
                    number_of_images=1,
                    # safety_filter_level="BLOCK_MEDIUM_AND_ABOVE", 
                    # person_generation="ALLOW_ADULT",
                )
            )
            
            # Process Imagen Response (Different structure than generate_content)
            if not response.generated_images:
                 raise ValueError("No images returned from Imagen")

            image_bytes = response.generated_images[0].image.image_bytes
            
            return GeminiBananaProImageOutput(
                success=True,
                status=200,
                image_data=image_bytes,
                prompt=original_prompt,
                model=self.model
            )

        except Exception as e:
            logger.exception("generate_image_from_image failed")
            return GeminiBananaProImageOutput(
                success=False,
                status=500,
                prompt=input_data.prompt,
                model=self.model,
                error=str(e)
            )

    async def generate_image_from_text(
        self, input_data: GeminiBananaProTextToImageInput
    ) -> GeminiBananaProImageOutput:
        try:
            prompt = input_data.prompt
            
            logger.info(f"Generating image from text with {self.model} using generate_images...")
            response = self.client.models.generate_images(
                model=self.model,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    aspect_ratio=input_data.ratio.value,
                    number_of_images=1,
                )
            )

            # Process Imagen Response
            if not response.generated_images:
                 raise ValueError("No images returned from Imagen")

            image_bytes = response.generated_images[0].image.image_bytes
            
            return GeminiBananaProImageOutput(
                success=True,
                status=200,
                image_data=image_bytes,
                prompt=prompt,
                model=self.model
            )

        except Exception as e:
            logger.exception("generate_image_from_text failed")
            return GeminiBananaProImageOutput(
                success=False,
                status=500,
                prompt=input_data.prompt,
                model=self.model,
                error=str(e)
            )

    def _get_image_part(self, image_input: Union[str, bytes]) -> types.Part:
        """Convert image input (url or bytes) to types.Part."""
        if isinstance(image_input, bytes):
            # Detect mime type from bytes magic numbers if possible, or default to png/jpeg
            # For simplicity, let's try to detect or default.
            mime_type = self._detect_mime_type(image_input)
            return types.Part.from_bytes(data=image_input, mime_type=mime_type)
        
        elif isinstance(image_input, str):
            # Check for Data URI (from frontend screenshot)
            if image_input.startswith("data:"):
                # Format: data:[<mediatype>][;base64],<data>
                # e.g. data:image/png;base64,iVBORw0KGgoAAAANSU...
                try:
                    import base64
                    header, data = image_input.split(",", 1)
                    mime_type = header.split(";", 1)[0].replace("data:", "")
                    image_bytes = base64.b64decode(data)
                    return types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                except Exception as e:
                    logger.error(f"Failed to decode data URI: {e}")
                    raise ValueError("Invalid data URI format")

            # It's a standard URL (or file path, but assuming URL here)
            # Simple MIME guess
            mime_type, _ = mimetypes.guess_type(image_input)
            if not mime_type:
                mime_type = "image/png" # Fallback
            
            return types.Part.from_uri(file_uri=image_input, mime_type=mime_type)
    
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    def _detect_mime_type(self, data: bytes) -> str:
        """Simple magic number check."""
        if data.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        elif data.startswith(b"\xff\xd8"):
            return "image/jpeg"
        elif data.startswith(b"GIF8"):
            return "image/gif"
        elif data.startswith(b"RIFF") and data[8:12] == b"WEBP":
            return "image/webp"
        return "image/png" # Default

    def _process_response(self, response, prompt: str) -> GeminiBananaProImageOutput:
        # Extract the image from the response
        # Typically response.candidates[0].content.parts[0].inline_data
        
        if not response.candidates:
             raise ValueError("No candidates returned")
        
        candidate = response.candidates[0]
        
        # Check for safety filter refusal
        if candidate.finish_reason != "STOP":
             # It might be SAFETY or other reasons
             logger.warning(f"Generation finished with reason: {candidate.finish_reason}")
        
        image_bytes = None
        for part in candidate.content.parts:
            if part.inline_data:
                image_bytes = part.inline_data.data
                break
        
        if not image_bytes:
             return GeminiBananaProImageOutput(
                success=False,
                status=500,
                prompt=prompt,
                model=self.model,
                error="No image data found in response"
            )

        return GeminiBananaProImageOutput(
            success=True,
            status=200,
            image_data=image_bytes,
            prompt=prompt,
            model=self.model
        )
