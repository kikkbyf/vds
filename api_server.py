import uvicorn
import base64
from dotenv import load_dotenv

load_dotenv()

from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.services.gemini_image_service import GeminiImageService
from src.interface.types.external_types import (
    GeminiBananaProImageToImageInput,
    GeminiBananaProTextToImageInput
)

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

service = GeminiImageService()

class GenerateRequest(BaseModel):
    prompt: str
    image_url: Optional[str] = None # Single URL or base64 data uri from frontend
    shot_preset: Optional[str] = None
    lighting_preset: Optional[str] = None
    focal_length: Optional[int] = None

@app.post("/generate")
async def generate_image(request: GenerateRequest):
    try:
        # The frontend sends a single image URL or data URI currently.
        # The service expects a list of image inputs (bytes or urls).
        
        image_inputs = []
        if request.image_url:
            # Check if it's a data URI (base64)
            if request.image_url.startswith("data:image"):
                # Extract base64 part
                try:
                    header, encoded = request.image_url.split(",", 1)
                    image_bytes = base64.b64decode(encoded)
                    image_inputs.append(image_bytes)
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid image data URI: {str(e)}")
            else:
                # Regular URL
                image_inputs.append(request.image_url)

        if image_inputs:
            # Image-to-Image
            input_data = GeminiBananaProImageToImageInput(
                prompt=request.prompt,
                image_url=image_inputs,
                ratio="16:9", # Default or extract from config if needed
                image_size="2K"
            )
            result = await service.generate_image_from_image(input_data)
        else:
            # Text-to-Image (Fallback if no image uploaded)
            input_data = GeminiBananaProTextToImageInput(
                prompt=request.prompt,
                ratio="16:9",
                image_size="2K"
            )
            result = await service.generate_image_from_text(input_data)

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error or "Generation failed")
        
        if result.image_data:
            # Convert bytes back to base64 data URI for frontend to display
            b64_img = base64.b64encode(result.image_data).decode('utf-8')
            return {"image_data": f"data:image/png;base64,{b64_img}"}
        
        raise HTTPException(status_code=500, detail="No image data returned")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
