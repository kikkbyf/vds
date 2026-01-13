import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4"
)

print("Type of client._api_client:", type(client._api_client))
print("Dir of client._api_client:", dir(client._api_client))

# Try to find where HttpRequest comes from to construct it manually
# It likely comes from google.genai.types.HttpRequest or similar?
# Let's check api_client.py location if possible, or just dir the types again.

from google.genai import types
print("Types available:", dir(types))
