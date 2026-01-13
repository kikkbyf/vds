import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Attempt to patch ImageConfig to allow extra fields
try:
    # Check if it's Pydantic v2 style
    if hasattr(types.ImageConfig, 'model_config'):
        print("Patching Pydantic v2 model_config...")
        # We need to act on the class itself
        types.ImageConfig.model_config['extra'] = 'allow'
        # Rebuild if necessary (some pydantic versions need it)
        try:
             types.ImageConfig.model_rebuild()
        except:
             pass
    else:
        # Pydantic v1 style (Config inner class)
        print("Patching Pydantic v1 Config...")
        types.ImageConfig.Config.extra = 'allow'

    print("Patch applied.")
except Exception as e:
    print(f"Patching failed: {e}")

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4"
)

try:
    print("Testing 4K Generation with PATCH...")
    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents="A pixel art red square",
        config={
            "response_modalities": ["IMAGE"],
            "image_config": {
                 "aspect_ratio": "1:1",
                 "image_size": "2K" # Testing 2K
            }
        }
    )
    
    # Check output size
    if response.candidates and response.candidates[0].content.parts[0].inline_data:
        data = response.candidates[0].content.parts[0].inline_data.data
        print(f"Success! Output bytes: {len(data)}")
    else:
        print("No image data in response")

except Exception as e:
    print(f"Failed with PATCH: {e}")
