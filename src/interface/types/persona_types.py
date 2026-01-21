from pydantic import BaseModel, Field
from typing import Optional, Literal

class PersonaProfile(BaseModel):
    age: int = Field(..., description="Age of the persona")
    gender: str = Field(..., description="Gender identity (e.g., Male, Female, Non-binary)")
    ethnicity: str = Field(..., description="Ethnic background or heritage")

class PersonaBody(BaseModel):
    body_build: str = Field(..., description="Body build description (e.g., Slim, Athletic, Curvy, Muscular, Heavyset)")
    height_vibe: str = Field(..., description="Perceived height vibe (e.g., Petite, Average, Towering)")

class PersonaFace(BaseModel):
    hair_style: str = Field(..., description="Hairstyle and length")
    hair_color: str = Field(..., description="Hair color")
    eye_color: str = Field(..., description="Eye color")
    face_feature: str = Field(..., description="Distinctive facial feature to avoid generic faces")

class PersonaSkin(BaseModel):
    skin_tone: str = Field(..., description="Skin complexion description")
    skin_texture: str = Field(..., description="Skin texture details (e.g., Freckles, Smooth, Wrinkled)")

class PersonaStyle(BaseModel):
    clothing: str = Field(..., description="Clothing style and outfit description")
    expression: str = Field(..., description="Facial expression and emotional vibe")
    lighting: str = Field(..., description="Lighting setup and atmosphere")

class PersonaMeta(BaseModel):
    is_human_realistic: bool = Field(..., description="True if the character is a standard real-world human; False if fictional, anthropomorphic, or creature-like.")

class DigitalPersona(BaseModel):
    meta: PersonaMeta
    profile: PersonaProfile
    body: PersonaBody
    look: PersonaFace
    skin: PersonaSkin
    style: PersonaStyle
    additional_prompt: Optional[str] = Field(None, description="Specific character references, mixing instructions, or high-level vibe overrides (e.g. 'Harry Potter', 'Mix of Ironman and Thor')")

class InterpretRequest(BaseModel):
    user_input: str

class GeneratePersonaRequest(BaseModel):
    persona: DigitalPersona
    image_size: str = "1K" # 1K, 2K, 4K
    aspect_ratio: str = "1:1" # 1:1, 3:4, 4:3, 16:9
