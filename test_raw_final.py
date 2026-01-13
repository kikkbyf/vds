import os
import httpx
import asyncio
import google.auth
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
location = "global"
model = "gemini-3-pro-image-preview"
url = f"https://aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:generateContent"

print(f"Target URL: {url}")

# Auht
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

async def run():
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers, timeout=60)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Success! 2K request accepted.")
            # Check output 
            data = resp.json()
            if "candidates" in data:
                 print(f"Got candidates. Keys in candidate: {data['candidates'][0].keys()}")
        else:
            print(f"Failed: {resp.text}")

loop = asyncio.new_event_loop()
loop.run_until_complete(run())
