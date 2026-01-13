import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4"
)

# Print attributes of api_client
# Identify where credentials are stored
print("Attrs:", [x for x in dir(client._api_client) if not x.startswith("__")])

# Check if we can get a token
try:
    if hasattr(client._api_client, "credentials"):
        print("Has credentials obj")
        creds = client._api_client.credentials
        if hasattr(creds, "token"):
             print(f"Token present: {bool(creds.token)}")
        else:
             print("Creds has no token attr immediately")
    else:
        print("No credentials attr")
except Exception as e:
    print(e)
