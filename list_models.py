from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

def list_models():
    try:
        print(f"Listing models (Vertex AI)...")
        client_vertex = genai.Client(
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-east4")
        )
        for model in client_vertex.models.list():
            print(f"- {model.name} (Vertex)")

        print(f"\nListing models (Gemini API)...")
        client_gemini = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )
        for model in client_gemini.models.list():
            print(f"- {model.name} (Gemini)")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
