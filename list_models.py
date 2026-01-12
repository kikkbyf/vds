from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

def list_models():
    try:
        client = genai.Client(
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-east4")
        )
        print(f"Listing models...")
        for model in client.models.list():
            print(f"- {model.name}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
