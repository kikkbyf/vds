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
import asyncio
import os
import json
import time
from datetime import datetime

# --- Local Logging Setup ---
SESSION_ID = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_BASE_DIR = os.path.join(os.getcwd(), "_generation_logs", SESSION_ID)
os.makedirs(LOG_BASE_DIR, exist_ok=True)
print(f"📂 Logging session to: {LOG_BASE_DIR}")


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
    image_url: Optional[str] = None # Deprecated: Single URL or base64
    images: Optional[List[str]] = None # New: List of URLs or base64 
    shot_preset: Optional[str] = None
    lighting_preset: Optional[str] = None
    focal_length: Optional[int] = None
    # New Generation Controls
    aspect_ratio: str = "1:1"
    image_size: str = "1K"
    negative_prompt: Optional[str] = None
    guidance_scale: float = 60.0
    enhance_prompt: bool = True

@app.post("/generate")
async def generate_image(request: GenerateRequest):
    try:
        # Collect all image inputs from both 'image_url' and 'images' list
        raw_inputs = []
        if request.image_url:
            raw_inputs.append(request.image_url)
        if request.images:
            raw_inputs.extend(request.images)
        
        image_inputs = []
        for input_item in raw_inputs:
            # Check if it's a data URI (base64)
            if input_item.startswith("data:image"):
                try:
                    header, encoded = input_item.split(",", 1)
                    image_bytes = base64.b64decode(encoded)
                    image_inputs.append(image_bytes)
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid image data URI: {str(e)}")
            else:
                # Regular URL
                image_inputs.append(input_item)

        if image_inputs:
            # Image-to-Image
            input_data = GeminiBananaProImageToImageInput(
                prompt=request.prompt,
                image_url=image_inputs,
                ratio=request.aspect_ratio,
                image_size=request.image_size,
                negative_prompt=request.negative_prompt,
                guidance_scale=request.guidance_scale,
                enhance_prompt=request.enhance_prompt
            )
            result = await service.generate_image_from_image(input_data)
        else:
            # Text-to-Image (Fallback if no image uploaded)
            input_data = GeminiBananaProTextToImageInput(
                prompt=request.prompt,
                ratio=request.aspect_ratio,
                image_size=request.image_size,
                negative_prompt=request.negative_prompt,
                guidance_scale=request.guidance_scale,
                enhance_prompt=request.enhance_prompt
            )
            result = await service.generate_image_from_text(input_data)

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error or "Generation failed")
        
        if result.image_data:
            # --- Local Logging: Save Artifacts ---
            try:
                # 1. Create Request Folder
                req_id = f"req_{int(time.time()*1000)}"
                req_dir = os.path.join(LOG_BASE_DIR, req_id)
                os.makedirs(req_dir, exist_ok=True)

                # 2. Save Prompt & Metadata
                metadata = request.model_dump()
                # Remove large data from metadata if present (though images are separate strings)
                # metadata['images'] = [f"<base64_len_{len(x)}>" for x in (metadata.get('images') or [])]
                # metadata['image_url'] = "..." # Deprecated
                
                with open(os.path.join(req_dir, "prompt.json"), "w", encoding="utf-8") as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False, default=str)

                # 3. Save Input Images
                for idx, img_bytes in enumerate(image_inputs):
                    # We only have bytes here.
                    with open(os.path.join(req_dir, f"input_{idx}.png"), "wb") as f:
                        f.write(img_bytes)

                # 4. Save Output Image
                with open(os.path.join(req_dir, "output.png"), "wb") as f:
                    f.write(result.image_data)
                
                print(f"✅ Saved generation log to {req_dir}")

            except Exception as log_err:
                print(f"⚠️ Failed to save local log: {log_err}")

            # Convert bytes back to base64 data URI for frontend to display
            b64_img = base64.b64encode(result.image_data).decode('utf-8')
            return {"image_data": f"data:image/png;base64,{b64_img}"}
        
        raise HTTPException(status_code=500, detail="No image data returned")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
