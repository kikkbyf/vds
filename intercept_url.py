import os
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Monkey patch requests.Session.request to print info
original_request = requests.Session.request

def patched_request(self, method, url, *args, **kwargs):
    print(f"INTERCEPTED REQUEST: {method} {url}")
    # print headers if needed, but carefully mask token
    if "headers" in kwargs:
         SafeHeaders = kwargs["headers"].copy()
         if "Authorization" in SafeHeaders:
             SafeHeaders["Authorization"] = "Bearer [REDACTED]"
         # print(f"Headers: {SafeHeaders}")
    return original_request(self, method, url, *args, **kwargs)

requests.Session.request = patched_request

# Also patch httpx if used
try:
    import httpx
    original_httpx_request = httpx.Client.request
    def patched_httpx_request(self, method, url, *args, **kwargs):
        print(f"INTERCEPTED HTTPX: {method} {url}")
        return original_httpx_request(self, method, url, *args, **kwargs)
    httpx.Client.request = patched_httpx_request
except ImportError:
    pass

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"), 
    location="global" # Try the one I used, or let it default if I remove it?
    # Environment variable has 'global'. Let's set it to what works.
    # The previous code used os.getenv("GOOGLE_CLOUD_LOCATION", "global").
    # Let's use the one from .env directly.
)
# Force set location to what works in the app (global according to env)
# client._api_client.location = "global" # Not easy to set.

print("Running generation to capture URL...")
try:
    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents="test",
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="1:1")
        )
    )
    print("Generation call finished.")
except Exception as e:
    print(f"Generation failed (expected if token issues, but we want URL): {e}")

