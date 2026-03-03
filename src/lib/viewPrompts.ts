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
- Quality: 4K resolution, clean edges, production-ready reference.`,

    OIL_PAINTING_STYLE: `Transform the original photograph into a museum-grade oil painting while preserving 100% structural fidelity to the source image.

Do NOT alter composition, camera angle, crop ratio, perspective, anatomy, gaze direction, facial proportions, pose, lighting direction, or focal length compression. The original framing and spatial hierarchy must remain locked.

Translate digital lighting into physical oil paint logic:
- Highlights rendered with controlled impasto thickness
- Midtones modeled with directional bristle brushwork following anatomical planes
- Shadows built through layered glazing, subtle pigment transparency
- Preserve original light temperature and contrast

Replace photographic smoothness with tactile material realism:
- Visible hog-bristle brush strokes
- Palette knife edge transitions in background
- Natural canvas weave texture subtly visible
- Slight pigment grit in darker passages
- Micro-variations in oil viscosity

Skin rendering:
- No airbrushed smoothing
- Preserve pores, micro texture, natural asymmetry
- Use fine sable brush detailing for eyes and key facial features
- Maintain likeness accuracy

Edges:
- Focal areas crisp with deliberate stroke direction
- Secondary areas softened through painterly blending, not blur

Background:
- Maintain original depth structure
- Convert bokeh or blur into abstract painterly mass with broad brush movement

Forbid:
anime, cartoon, Pixar style, 3D render, CGI, plastic skin, beauty filter, over-smoothing, stylization drift, fantasy reinterpretation.

Result must resemble a tangible, hand-painted oil painting on stretched canvas, gallery-level realism.

Increase painterly abstraction slightly:
- Broader, more visible brush strokes
- Stronger impasto texture in highlights
- Slight simplification of micro-detail while keeping likeness intact
- Expressive stroke direction following facial structure
- Controlled reduction of hyper-real micro sharpness`
};
