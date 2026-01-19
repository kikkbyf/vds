from src.interface.types.persona_types import DigitalPersona

class PromptCompiler:
    @staticmethod
    def compile(persona: DigitalPersona) -> str:
        """
        Compiles the DigitalPersona JSON into a structural prompt for Gemini 3 Pro.
        Uses a 'Section-based' weight distribution strategy.
        """
        
        # 1. Subject Definition (Who)
        subject_block = (
            f"A hyper-realistic, 8k resolution medium shot portrait of a {persona.profile.age} year old "
            f"{persona.profile.ethnicity} {persona.profile.gender}. "
            f"Physique: {persona.body.body_build} build, {persona.body.height_vibe} stature."
        )

        # 2. Visual Center (Face & Hair) - High Priority
        face_block = (
            f"Face details: {persona.look.face_feature}. "
            f"Hair: {persona.look.hair_style}, color {persona.look.hair_color}. "
            f"Eyes: {persona.look.eye_color}, highly detailed iris."
        )

        # 3. Macro Details (Skin) - Crucial for "Digital Human" feel
        skin_block = (
            f"Skin: {persona.skin.skin_tone} complexion, {persona.skin.skin_texture}. "
            "Subsurface scattering enabled, visible pores, peach fuzz, hyper-detailed skin texture."
        )

        # 4. Style & Vibe (Context)
        style_block = (
            f"Attire: Wearing {persona.style.clothing}. "
            f"Expression: {persona.style.expression}, staring at camera. "
            f"Lighting: {persona.style.lighting}, cinematic lighting, volumetric fog, high contrast, raytracing."
        )

        # 5. Technical Gluing
        technical_block = "Photography: Shot on 85mm lens, f/1.8, bokeh background, sharp focus on eyes, masterwork, award winning photography."

        # Final Assembly
        reference_block = f"Key Character Reference/Mix: {persona.additional_prompt}" if persona.additional_prompt else ""

        final_prompt = f"""
        {reference_block}

        {subject_block}

        {face_block}

        {skin_block}

        {style_block}

        {technical_block}
        """

        return final_prompt.strip()
