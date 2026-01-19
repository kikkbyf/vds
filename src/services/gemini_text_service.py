import os
import json
import logging
from google import genai
from google.genai import types
from src.interface.types.persona_types import DigitalPersona

logger = logging.getLogger(__name__)

class GeminiTextService:
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = "us-central1" # Flash is often in us-central1 or global, let's try global if strictly needed, but SDK usually handles it.
        # Actually, let's stick to what image service uses or default.
        # For Flash 2.0 experimental, it might be specific.
        # Let's assume standard 'gemini-2.0-flash-exp' is available.
        
        self.client = genai.Client(vertexai=True, project=self.project_id, location=self.location)
        # Switching to Gemini 2.5 Flash as requested (Note: This version may not exist)
        self.model_name = "gemini-2.5-flash" 

    def interpret_persona(self, user_text: str) -> DigitalPersona:
        """
        Interprets unstructured text into a strict DigitalPersona JSON structure.
        Uses Gemini 2.0 Flash with low temperature for stability.
        """
        
        system_instruction = """
        You are a world-class Character Design Expert and Digital Human Architect.
        Your goal is to translate the user's vague or specific description into a COMPLETE, PROFESSIONAL, and BIOLOGICALLY CONSISTENT character specification.

        RULES:
        1. **Invent Details**: If the user doesn't specify something, you MUST hallucinate it based on probability and style consistency. Do not leave fields empty.
        2. **Professional Terminology**: Convert simple terms into industry-standard descriptions (e.g., "red hair" -> "Auburn with copper highlights").
        3. **Consistency**: Ensure age, ethnicity, and features strictly match.
        4. **Extraction**: If the user mentions specific known characters (e.g. 'Harry Potter', 'Iron Man'), put that in the 'additional_prompt' field.
        5. **Output Format**: You must output ONLY valid JSON matching the schema.
        6. **No Chit-Chat**: Do not output anything other than the JSON.
        """

        prompt = f"User Intent: {user_text}"

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=DigitalPersona,
                    temperature=0.7, # Allow some creativity for "Invention"
                )
            )
            
            # The SDK with response_schema should return a parsed object or text that strictly adheres.
            # We can access parsed content if using pydantic in newer SDKs, but let's parse text to be safe across versions.
            
            if not response.text:
                raise ValueError("Empty response from Gemini")

            # Parse JSON
            data = json.loads(response.text)
            
            # Validate with Pydantic
            persona = DigitalPersona(**data)
            return persona

        except Exception as e:
            logger.error(f"Interpretation failed: {e}")
            # Fallback or re-raise
            raise e
