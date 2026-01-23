import uvicorn
import base64
from dotenv import load_dotenv

load_dotenv()

from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
import secrets
from datetime import datetime

# --- Configuration & Secrets ---
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")
if not INTERNAL_API_SECRET:
    print("⚠️  WARNING: INTERNAL_API_SECRET not set in .env! Security is compromised.")

# --- Local Logging Setup ---
# Base session ID for fallback
SESSION_ID = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_BASE_DIR = os.path.join(os.getcwd(), "_generation_logs", SESSION_ID)
os.makedirs(LOG_BASE_DIR, exist_ok=True)
print(f"📂 Default logging session to: {LOG_BASE_DIR}")


app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Zero Trust Security Middleware ---
@app.middleware("http")
async def verify_internal_secret(request: Request, call_next):
    # Skip security check for docs/openapi if needed, or protect them too.
    # For now, we strictly protect everything.
    if request.url.path in ["/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)

    client_host = request.client.host
    # 1. Network Isolation Check (Double check even if bind is local)
    if client_host not in ["127.0.0.1", "::1"]:
        # Should not happen if bind is correct, but safe to check
        return JSONResponse(status_code=403, content={"detail": "Forbidden Access"})

    # 2. Secret Verification
    secret_header = request.headers.get("X-Internal-Secret")
    if not secret_header or not INTERNAL_API_SECRET:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    
    # Constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(secret_header, INTERNAL_API_SECRET):
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})

    response = await call_next(request)
    return response


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

# --- Persona Flow Endpoints ---
from src.interface.types.persona_types import DigitalPersona, InterpretRequest, GeneratePersonaRequest
from src.services.gemini_text_service import GeminiTextService
from src.services.prompt_compiler import PromptCompiler

text_service = GeminiTextService()

@app.post("/interpret")
async def interpret_persona(request: InterpretRequest):
    try:
        persona = text_service.interpret_persona(request.user_input)
        return persona
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_persona")
async def generate_persona(request: GeneratePersonaRequest, raw_request: Request):
    try:
        # Compiler: JSON -> Professional Prompt
        compiled_prompt = PromptCompiler.compile(request.persona)
        
        # Capture Transaction ID for Logging (Shared Logic with /generate)
        transaction_id = raw_request.headers.get("X-Transaction-ID", f"unknown_{int(time.time())}")
        
        # Reuse existing Image Service (Text-to-Image Flow)
        input_data = GeminiBananaProTextToImageInput(
            prompt=compiled_prompt,
            ratio=request.aspect_ratio,
            image_size=request.image_size,
            negative_prompt="low quality, bad anatomy, worst quality, unrealistic, cartoon, anime", # Standard negative
            guidance_scale=60.0,
            enhance_prompt=False # Compiler does the job
        )
        
        result = await service.generate_image_from_text(input_data)

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error or "Generation failed")
        
        if result.image_data:
            # --- Local Logging: Save Artifacts ---
            try:
                req_dir_name = transaction_id if transaction_id else f"req_{int(time.time()*1000)}"
                req_dir = os.path.join(LOG_BASE_DIR, req_dir_name)
                os.makedirs(req_dir, exist_ok=True)
                
                # Save Metadata (The original JSON)
                with open(os.path.join(req_dir, "persona.json"), "w", encoding="utf-8") as f:
                    # Use json.dump with ensure_ascii=False to keep Chinese compliant
                    json.dump(request.persona.model_dump(), f, indent=2, ensure_ascii=False)

                # Save Compiled Prompt
                with open(os.path.join(req_dir, "prompt_compiled.txt"), "w", encoding="utf-8") as f:
                    f.write(compiled_prompt)

                # Save Output Image
                with open(os.path.join(req_dir, "output.png"), "wb") as f:
                    f.write(result.image_data)
                
                print(f"✅ Saved persona log to {req_dir} (TxID: {transaction_id})")

            except Exception as log_err:
                print(f"⚠️ Failed to save local log: {log_err}")

            b64_img = base64.b64encode(result.image_data).decode('utf-8')
            return {
                "image_data": f"data:image/png;base64,{b64_img}",
                "compiled_prompt": compiled_prompt
            }
            
        raise HTTPException(status_code=500, detail="No image data returned")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_image(request: GenerateRequest, raw_request: Request):
    try:
        # Capture Transaction ID for Logging
        transaction_id = raw_request.headers.get("X-Transaction-ID", f"unknown_{int(time.time())}")

        # Collect all image inputs from both 'image_url' and 'images' list
        raw_inputs = []
        if request.image_url:
            raw_inputs.append(request.image_url)
        if request.images:
            raw_inputs.extend(request.images)
        
        image_inputs = []
        for input_item in raw_inputs:
            # Check if it's a data URI (base64)
            if input_item.startswith("data:"):
                try:
                    header, encoded = input_item.split(",", 1)
                    image_bytes = base64.b64decode(encoded)
                    image_inputs.append(image_bytes)
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid image data URI: {str(e)}")
            elif input_item.startswith("http"):
                # Remote URL
                try:
                    import requests
                    resp = requests.get(input_item, timeout=30)
                    resp.raise_for_status()
                    image_inputs.append(resp.content)
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch image from URL: {str(e)}")
            else:
                # Local Path (e.g. /uploads/...)
                try:
                    # Handle Next.js /api/uploads/ virtual path
                    if "/api/uploads/" in input_item:
                        # Convert /api/uploads/xyz.png -> public/uploads/xyz.png
                        filename = input_item.split("/api/uploads/")[-1]
                        possible_paths = [
                            os.path.join("public", "uploads", filename),
                            os.path.join(os.getcwd(), "public", "uploads", filename),
                            # Explicit fallback for Railway/Docker default path
                            os.path.join("/app", "public", "uploads", filename)
                        ]
                    else:
                        # Standard local path handling
                        clean_path = input_item.lstrip("/")
                        possible_paths = [
                            clean_path,
                            os.path.join("public", clean_path),
                            os.path.join(os.getcwd(), clean_path),
                            os.path.join("/app", clean_path)
                        ]
                    
                    found_bytes = None
                    for p in possible_paths:
                        if os.path.exists(p) and os.path.isfile(p):
                            with open(p, "rb") as f:
                                found_bytes = f.read()
                            break
                    
                    if found_bytes:
                        image_inputs.append(found_bytes)
                    else:
                        # Log the attempted paths for debugging
                        logger.error(f"File not found. Tried: {possible_paths}")
                        raise FileNotFoundError(f"Could not find local file: {input_item}")
                except Exception as e:
                    logger.error(f"Error loading image {input_item}: {str(e)}")
                    # Don't crash the whole batch if one reference fails, or maybe we should?
                    # The user expects this image to be used.
                    raise HTTPException(status_code=400, detail=f"Failed to load local image: {str(e)}")

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
                # Use Transaction ID for folder name if possible to link with Next.js logs
                # Fallback to session structure if needed, or create a new structure.
                # Requirement: "Must parse and record Header X-Transaction-ID"
                
                # We will create a folder specific to this transaction inside the session log
                # or a dedicated structure? User said: "Can locate specific log file via Transaction ID"
                # Let's use the transaction ID as the folder name.
                
                req_dir_name = transaction_id if transaction_id else f"req_{int(time.time()*1000)}"
                # Use the global LOG_BASE_DIR (Session ID) -> Transaction ID
                req_dir = os.path.join(LOG_BASE_DIR, req_dir_name)
                os.makedirs(req_dir, exist_ok=True)

                # 2. Save Prompt & Metadata
                metadata = request.model_dump()
                metadata['transaction_id'] = transaction_id
                
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
                
                print(f"✅ Saved generation log to {req_dir} (TxID: {transaction_id})")

            except Exception as log_err:
                print(f"⚠️ Failed to save local log: {log_err}")

            # Convert bytes back to base64 data URI for frontend to display
            b64_img = base64.b64encode(result.image_data).decode('utf-8')
            return {"image_data": f"data:image/png;base64,{b64_img}"}
        
        raise HTTPException(status_code=500, detail="No image data returned")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Host must be 127.0.0.1 for isolation
    uvicorn.run(app, host="127.0.0.1", port=8000)
