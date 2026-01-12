from google.genai import types
import inspect

print("Fields of types.ImageConfig:")
try:
    if hasattr(types.ImageConfig, '__annotations__'):
        for k, v in types.ImageConfig.__annotations__.items():
            print(f"{k}: {v}")
    else:
        print(dir(types.ImageConfig))
except Exception as e:
    print(e)
