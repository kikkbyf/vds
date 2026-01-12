from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

def inspect_client():
    try:
        client = genai.Client(
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-east4")
        )
        print("Methods on client.models:")
        for method in dir(client.models):
            if not method.startswith("_"):
                print(f"- {method}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_client()
