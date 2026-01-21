export interface PersonaProfile {
    age: number;
    gender: string;
    ethnicity: string;
}

export interface PersonaBody {
    body_build: string;
    height_vibe: string;
}

export interface PersonaFace {
    hair_style: string;
    hair_color: string;
    eye_color: string;
    face_feature: string;
}

export interface PersonaSkin {
    skin_tone: string;
    skin_texture: string;
}

export interface PersonaStyle {
    clothing: string;
    expression: string;
    lighting: string;
}

export interface PersonaMeta {
    is_human_realistic: boolean;
}

export interface DigitalPersona {
    meta: PersonaMeta;
    profile: PersonaProfile;
    body: PersonaBody;
    look: PersonaFace;
    skin: PersonaSkin;
    style: PersonaStyle;
    additional_prompt?: string;
}
