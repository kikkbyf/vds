from google.genai import types
import inspect

print("Fields of types.GenerateContentConfig:")
try:
    # It might be a TypedDict or Pydantic model
    if hasattr(types.GenerateContentConfig, '__annotations__'):
        for k, v in types.GenerateContentConfig.__annotations__.items():
            print(f"{k}: {v}")
    else:
        print(dir(types.GenerateContentConfig))
except Exception as e:
    print(e)
