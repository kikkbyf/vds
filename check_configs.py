from google.genai import types

def get_fields(cls):
    return {name: str(field.annotation) for name, field in cls.model_fields.items()}

print('--- GENERATE ---')
for k, v in get_fields(types.GenerateImagesConfig).items():
    print(f"{k}: {v}")

print('\n--- EDIT ---')
for k, v in get_fields(types.EditImageConfig).items():
    print(f"{k}: {v}")
