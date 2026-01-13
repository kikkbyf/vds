import os
import json
import requests
from google import genai
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4"
)

# Extract working credentials
creds = client._api_client._credentials
if not creds.valid:
    creds.refresh(Request())

print(f"Got creds with scopes: {creds.scopes if hasattr(creds, 'scopes') else 'Unknown'}")

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
location = "us-east4"
model = "gemini-3-pro-image-preview"

url = f"https://{location}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:generateContent"

print(f"URL: {url}")

payload = {
    "contents": [{
        "role": "user",
        "parts": [{"text": "A comprehensive map of a fantasy world, high resolution 4k style"}]
    }],
    "generationConfig": {
        "responseModalities": ["IMAGE"],
        "imageConfig": {
            "aspectRatio": "16:9",
            "imageSize": "2K"  # Testing 2K
        }
    }
}

headers = {
    "Authorization": f"Bearer {creds.token}",
    "Content-Type": "application/json; charset=utf-8"
}

try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        rjson = response.json()
        # Verify output
        if "candidates" in rjson and rjson["candidates"]:
             print("Has candidates")
             cand = rjson["candidates"][0]
             if "content" in cand and "parts" in cand["content"]:
                 print("Has parts")
                 # We assume inline data or similar
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
