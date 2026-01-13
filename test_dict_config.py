import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4"
)

try:
    print("Testing 4K Generation with DICT config...")
    # Passing dict directly to bypass local pydantic strictness
    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents="A pixel art red square",
        config={
            "response_modalities": ["IMAGE"],
            "image_config": {
                 "aspect_ratio": "1:1",
                 "image_size": "2K" # Testing 2K first
            }
        }
    )
    print("Request sent successfully (no validation error).")
    
    # Check output size
    if response.candidates and response.candidates[0].content.parts[0].inline_data:
        data = response.candidates[0].content.parts[0].inline_data.data
        print(f"Success! Output bytes: {len(data)}")
    else:
        print("No image data in response")

except Exception as e:
    print(f"Failed with DICT: {e}")
