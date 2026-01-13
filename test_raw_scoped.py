import os
import requests
import google.auth
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
location = "us-east4"
model = "gemini-3-pro-image-preview"
url = f"https://{location}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:generateContent"

print(f"URL: {url}")

# Force correct scope
scopes = ["https://www.googleapis.com/auth/cloud-platform"]
creds, _ = google.auth.default(scopes=scopes)
creds.refresh(Request())

print(f"Token obtained: {creds.token[:10]}...")

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
