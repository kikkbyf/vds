export const FACE_SWAP_PROMPTS = {
    MAIN: `Image 1 is the TARGET IMAGE (Base Style & Composition). Image 2 is the FACE REFERENCE.
    
    ACTION: Perform a high-quality ID swap / Face Swap. replace the face of the main character in Image 1 with the face features from Image 2.
    
    CRITICAL RULES:
    1. KEEP the exact art style, lighting, color palette, and background of Image 1.
    2. KEEP the pose, expression (unless specified otherwise), and body type of Image 1.
    3. BLEND the new face naturally into the existing lighting environment of Image 1.
    4. If the User provided extra instructions, apply them subtly without breaking the above rules.
    
    Output ONLY the modified Image 1.`
};
