from google import genai
from google.genai import types

print("Attributes of google.genai.types:")
try:
    for attr in dir(types):
        if "Config" in attr:
            print(attr)
except Exception as e:
    print(e)
