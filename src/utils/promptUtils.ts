export const BASE_PROMPT = "请你仔细观察该角色的姿势动作，并且给我准确的线稿透视姿势图，去解剖该图片的人物姿势。把关键的的关节点用黑点表示。确保姿态线稿图清晰可见。摄影机视角完全一致。人物姿态完全一致。避免出现骨骼结构。";

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
