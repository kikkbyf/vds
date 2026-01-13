import os
import requests
import google.auth
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
location = "global"
model = "gemini-3-pro-image-preview"
url = f"https://aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:generateContent"

print(f"Target URL: {url}")

# Auth
scopes = ["https://www.googleapis.com/auth/cloud-platform"]
creds, _ = google.auth.default(scopes=scopes)
creds.refresh(Request())
token = creds.token

payload = {
    "contents": [{
        "role": "user",
        "parts": [{"text": "A pixel art red square, 4k"}]
    }],
    "generationConfig": {
        "responseModalities": ["IMAGE"],
        "imageConfig": {
            "aspectRatio": "1:1",
            "imageSize": "2K" # Testing 2K passing
        }
    }
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json; charset=utf-8"
}

try:
    print("Sending request...")
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Success! 2K request accepted.")
        data = response.json()
        if "candidates" in data:
             print(f"Got candidates. Keys in candidate: {data['candidates'][0].keys()}")
    else:
        print(f"Failed: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
