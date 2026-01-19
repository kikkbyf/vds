export const VIEW_PROMPTS = {
    HEADSHOT_GRID: `[LAYOUT STRUCTURE]
Output: 2x2 Grid Image.
Panel 1 (Top-Left): Frontal Face View.
Panel 2 (Top-Right): 90° Right Profile View.
Panel 3 (Bottom-Left): 45° 3/4 Angle View.
Panel 4 (Bottom-Right): 45° Rear/Back Head View.

[STYLE & CONSISTENCY]
- CRITICAL: Perfectly clone the art style, rendering technique, and texture resolution of the input character.
- If input is 3D, output 3D. If input is 2D/Anime, output 2D/Anime.
- Maintain identical facial features, hair structure, and skin texture.
- No style drift. No filter effects.

[TECHNICAL EXECUTION]
- Background: Pure solid #FFFFFF White.
- Framing: Close-up Head & Neck only (Passport style).
- Lighting: Neutral, flat, shadowless technical lighting to reveal all details.
- Quality: 4K resolution, sharp lines, noise-free.`,

    TURNAROUND_SHEET: `[LAYOUT STRUCTURE]
Output: Horizontal Character Sheet.
Arrangement (Left to Right): Front View | Side View | Rear View.
Scale: All views must be aligned at the same floor level and head height.

[STYLE & CONSISTENCY]
- CRITICAL: Match the input character's design, proportions, and costume details 100%.
- Texture and shading must be indistinguishable from the source image.
- Preserve the exact color palette and material properties (e.g., fabric sheen, metal reflection).

[TECHNICAL EXECUTION]
- Background: Pure solid #FFFFFF White.
- Pose: Neutral Standing A-Pose (Arms relaxed at sides, legs straight).
- Framing: Full body, Head to Toe.
- Quality: 4K resolution, clean edges, production-ready reference.`
};
