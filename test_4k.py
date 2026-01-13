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
    print("Testing 4K Generation...")
    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents="A simple red square",
        config={
            "response_modalities": ["IMAGE"],
            "image_config": {
                 "image_size": "4K",  # Testing input "4K"
                 "aspect_ratio": "1:1"
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
    print(f"Failed with '4K': {e}")
