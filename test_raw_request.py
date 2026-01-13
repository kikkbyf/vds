import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4"
)

try:
    print("Testing 4K Generation with RAW request...")
    
    # Construct raw payload
    payload = {
        "contents": [{
            "role": "user",
            "parts": [{"text": "A comprehensive map of a fantasy world, high resolution 4k style"}]
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {
                "aspectRatio": "16:9",
                "imageSize": "2K" # Testing 2K
            }
        }
    }
    
    # Use internal api client to send raw request
    # Method signature: request(self, http_request, http_options=None, stream=False)
    # We need to construct a http_request-like object or see what it expects.
    # Actually, looking at tracebacks, it might be easier to just use requests/httpx with the creds.
    # But let's look at available methods on client object first.
    
    # Easier: Use , so it uses Vertex AI endpoints.
    # Let's try to infer endpoint from the client or just construct it.
    
    # Alternative: The SDK likely has a  method.
    # Let's try to find a way to use the authenticated session.
    
    print("Direct API client usage is complex without checking source. Fallback to 'requests' with Application Default Credentials.")
    
    import google.auth
    from google.auth.transport.requests import Request
    import requests

    credentials, project_id = google.auth.default()
    credentials.refresh(Request())
    
    url = f"https://us-east4-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-east4/publishers/google/models/gemini-3-pro-image-preview:predict"
    
    headers = {
        "Authorization": f"Bearer {credentials.token}",
        "Content-Type": "application/json; charset=utf-8"
    }
    
    # Vertex AI Predict API format might differ from Gemini API generateContent format.
    # Warning: Vertex AI uses "instances" and "parameters" usually, but Gemini on Vertex might use generateContent signature.
    # Let's try the generateContent endpoint convention for Vertex.
    
    url_generate = f"https://us-east4-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/us-east4/publishers/google/models/gemini-3-pro-image-preview:generateContent"
    
    print(f"Target URL: {url_generate}")
    
    response = requests.post(url_generate, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("Success! Raw request worked.")
        print("Response keys:", response.json().keys())
        # Check if we got image
        rjson = response.json()
        if "candidates" in rjson:
           print("Candidates found.")
           # Verify we got data
    else:
        print(f"Failed: {response.status_code} {response.text}")

except Exception as e:
    print(f"Failed with RAW: {e}")
