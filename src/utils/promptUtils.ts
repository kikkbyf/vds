export const BASE_PROMPT = `仔细研究我上传的这两张图：
第一张是我需要的构图、方向、姿势。其中一张是人物面部标准四宫格白底图（作为参考）。另一张图是模特全身多角度白底图（作为参考）。
输出图内容：模特做图1的姿势，表情神态姿势发型动作完全一致。 面部自然。
输出限制：严格遵许我的图1的构图、角度、透视。不要自行扩充内容。
输出标准：把人物放在图1的构图下。输出一张光线自然的人像图。`;

export const SHOT_LABELS: Record<string, string> = {
    closeup: 'Close-up (特写)',
    fullbody: 'Full Body (全身)',
    cowboy: 'Cowboy Shot (七分身)',
};

export const LIGHTING_LABELS: Record<string, string> = {
    rembrandt: 'Rembrandt (伦勃朗光)',
    butterfly: 'Butterfly (蝴蝶光)',
    split: 'Split (分割光)',
    softbox: 'Softbox (柔光箱)',
    hard: 'Hard Light (硬光)',
};

export const LENS_LABELS: Record<number, string> = {
    24: '24mm (Wide)',
    35: '35mm (Standard Wide)',
    50: '50mm (Human Eye)',
    85: '85mm (Portrait)',
    200: '200mm (Telephoto)',
};

export function generatePrompt(shotPreset: string, focalLength: number, lightingPreset: string): string {
    const shotInfo = SHOT_LABELS[shotPreset] || shotPreset;
    const lensInfo = LENS_LABELS[focalLength] || `${focalLength}mm`;
    const lightInfo = LIGHTING_LABELS[lightingPreset] || lightingPreset;

    return `${BASE_PROMPT}\n\n景别: ${shotInfo}\n镜头焦段: ${lensInfo}\n光线: ${lightInfo}`;
}
