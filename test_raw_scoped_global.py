import os
import requests
import google.auth
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
# Try us-central1 as it is the most common region for new models if global refers to endpoint type or is just a default
# Note: 'global' region usually doesn't work for Vertex AI predictive/generative endpoints directly like this, 
# they are usually regional (us-central1, us-east4, etc).
# If .env says 'global', maybe it means something else in the app logic?
# Let's try 'us-central1' explicitly as a fallback for 4K model availability.
location = "us-central1" 
model = "gemini-3-pro-image-preview"
url = f"https://{location}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:generateContent"

print(f"URL: {url}")

scopes = ["https://www.googleapis.com/auth/cloud-platform"]
creds, _ = google.auth.default(scopes=scopes)
creds.refresh(Request())

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
        print("Success! Raw request worked.")
        rjson = response.json()
        print(f"Response keys: {rjson.keys()}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
