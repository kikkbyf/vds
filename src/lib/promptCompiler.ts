import { DigitalPersona } from '@/interface/types/persona_types';

export function compilePrompt(persona: DigitalPersona): string {
    const subjectBlock = `A hyper-realistic, 8k resolution medium shot portrait of a ${persona.profile.age} year old ${persona.profile.ethnicity} ${persona.profile.gender}. Physique: ${persona.body.body_build} build, ${persona.body.height_vibe} stature.`;

    const faceBlock = `Face details: ${persona.look.face_feature}. Hair: ${persona.look.hair_style}, color ${persona.look.hair_color}. Eyes: ${persona.look.eye_color}, highly detailed iris.`;

    const skinBlock = `Skin: ${persona.skin.skin_tone} complexion, ${persona.skin.skin_texture}. Subsurface scattering enabled, visible pores, peach fuzz, hyper-detailed skin texture.`;

    const styleBlock = `Attire: Wearing ${persona.style.clothing}. Expression: ${persona.style.expression}, staring at camera. Lighting: ${persona.style.lighting}, cinematic lighting, volumetric fog, high contrast, raytracing.`;

    const technicalBlock = "Photography: Shot on 85mm lens, f/1.8, bokeh background, sharp focus on eyes, masterwork, award winning photography.";

    const referenceBlock = persona.additional_prompt ? `Key Character Reference/Mix: ${persona.additional_prompt}` : "";

    return `
${referenceBlock}

${subjectBlock}

${faceBlock}

${skinBlock}

${styleBlock}

${technicalBlock}
    `.trim().replace(/\n\s*\n/g, '\n\n'); // Clean up extra newlines
}
