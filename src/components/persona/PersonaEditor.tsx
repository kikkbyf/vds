'use client';

import { DigitalPersona } from '@/interface/types/persona_types';
import { Dispatch, SetStateAction } from 'react';

interface Props {
    persona: DigitalPersona;
    setPersona: Dispatch<SetStateAction<DigitalPersona | null>>;
}

export function PersonaEditor({ persona, setPersona }: Props) {

    const updateField = (section: Exclude<keyof DigitalPersona, 'additional_prompt'>, field: string, value: any) => {
        setPersona((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const InputRow = ({ label, value, onChange }: { label: string, value: string | number, onChange: (v: string) => void }) => (
        <div className="input-group">
            <label>{label}</label>
            <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <style jsx>{`
        .input-group {
            margin-bottom: 12px;
        }
        label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 4px;
            letter-spacing: 0.05em;
        }
        input {
            width: 100%;
            background: #222;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            color: var(--text-primary);
            font-family: var(--font-sans);
            transition: border-color 0.2s;
        }
        input:focus {
            outline: none;
            border-color: var(--text-muted);
        }
      `}</style>
        </div>
    );

    const Section = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => (
        <section className="section">
            <h3 style={{ borderLeftColor: color }}>{title}</h3>
            <div className="content">{children}</div>
            <style jsx>{`
            .section {
                margin-bottom: 32px;
                animation: fadeIn 0.5s ease-out;
            }
            h3 {
                font-size: 12px;
                font-weight: bold;
                color: var(--text-primary);
                margin-bottom: 16px;
                padding-left: 8px;
                border-left: 3px solid #ccc;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }
            .content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
        </section>
    );

    return (
        <div className="editor-container">
            {/* Profile */}
            <Section title="基本档案 (Profile)" color="#3b82f6">
                <div className="grid-2">
                    <InputRow label="年龄" value={persona.profile.age} onChange={(v) => updateField('profile', 'age', parseInt(v))} />
                    <InputRow label="性别" value={persona.profile.gender} onChange={(v) => updateField('profile', 'gender', v)} />
                </div>
                <InputRow label="种族/血统" value={persona.profile.ethnicity} onChange={(v) => updateField('profile', 'ethnicity', v)} />
            </Section>

            {/* Body */}
            <Section title="身体特征 (Body)" color="#10b981">
                <div className="grid-2">
                    <InputRow label="体型" value={persona.body.body_build} onChange={(v) => updateField('body', 'body_build', v)} />
                    <InputRow label="身高感" value={persona.body.height_vibe} onChange={(v) => updateField('body', 'height_vibe', v)} />
                </div>
            </Section>

            {/* Face & Look */}
            <Section title="面部特征 (Look)" color="#8b5cf6">
                <InputRow label="发型" value={persona.look.hair_style} onChange={(v) => updateField('look', 'hair_style', v)} />
                <InputRow label="发色" value={persona.look.hair_color} onChange={(v) => updateField('look', 'hair_color', v)} />
                <div className="grid-2">
                    <InputRow label="瞳色" value={persona.look.eye_color} onChange={(v) => updateField('look', 'eye_color', v)} />
                </div>
                <InputRow label="关键特征" value={persona.look.face_feature} onChange={(v) => updateField('look', 'face_feature', v)} />
            </Section>

            {/* Skin */}
            <Section title="皮肤质感 (Skin)" color="#f97316">
                <InputRow label="肤色" value={persona.skin.skin_tone} onChange={(v) => updateField('skin', 'skin_tone', v)} />
                <InputRow label="纹理/瑕疵" value={persona.skin.skin_texture} onChange={(v) => updateField('skin', 'skin_texture', v)} />
            </Section>

            {/* Style */}
            <Section title="风格氛围 (Style)" color="#ec4899">
                <InputRow label="服装" value={persona.style.clothing} onChange={(v) => updateField('style', 'clothing', v)} />
                <InputRow label="表情" value={persona.style.expression} onChange={(v) => updateField('style', 'expression', v)} />
                <InputRow label="灯光氛围" value={persona.style.lighting} onChange={(v) => updateField('style', 'lighting', v)} />
            </Section>

            {/* Special Reference */}
            <Section title="额外参考 / 混合 (Mix)" color="#e11d48">
                <div className="input-group">
                    <label>角色参考 / 补充指令 (例如: "哈利波特风格", "小罗伯特唐尼混合")</label>
                    <textarea
                        value={persona.additional_prompt || ''}
                        onChange={(e) => setPersona(prev => prev ? ({ ...prev, additional_prompt: e.target.value }) : null)}
                        placeholder="在此输入特定的角色名或混合指令..."
                    />

                </div>
            </Section>

            <style jsx>{`
        .editor-container {
            padding-bottom: 40px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        textarea {
            width: 100%;
            min-height: 80px;
            background: #222;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            color: var(--text-primary);
            font-family: var(--font-sans);
            resize: vertical;
        }
        textarea:focus {
            outline: none;
            border-color: var(--text-muted);
        }
        .input-group { margin-bottom: 12px; }
        label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 4px;
            letter-spacing: 0.05em;
        }
      `}</style>
        </div>
    );
}
