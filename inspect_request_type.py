import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-east4" # Or whatever makes it work
)

# Check if HttpRequest is in types
if hasattr(types, "HttpRequest"):
    print("Found types.HttpRequest")
    help(types.HttpRequest)
else:
    print("types.HttpRequest NOT found")
    # Search for anything looking like request
    print([t for t in dir(types) if "Request" in t])

