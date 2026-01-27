'use client';

import { Paperclip, X, Sparkles, Play, Upload } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface Props {
    targetImage: string | null;
    setTargetImage: (img: string | null) => void;
    faceImage: string | null;
    setFaceImage: (img: string | null) => void;
    extraPrompt: string;
    setExtraPrompt: (text: string) => void;
    imageSize: string;
    setImageSize: (size: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export function FaceSwapEditor({
    targetImage, setTargetImage,
    faceImage, setFaceImage,
    extraPrompt, setExtraPrompt,
    imageSize, setImageSize,
    onGenerate, isGenerating
}: Props) {

    const canGenerate = !!(targetImage && faceImage);
    const nextReplaceRef = useRef<'target' | 'face'>('target');

    const getCost = () => {
        const size = String(imageSize).toUpperCase();
        if (size.includes('4K')) return 5;
        if (size.includes('2K')) return 2;
        return 1;
    };

    // Global Paste Handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            if (!targetImage) {
                                setTargetImage(result);
                                nextReplaceRef.current = 'face';
                            } else if (!faceImage) {
                                setFaceImage(result);
                                nextReplaceRef.current = 'target';
                            } else {
                                if (nextReplaceRef.current === 'target') {
                                    setTargetImage(result);
                                    nextReplaceRef.current = 'face';
                                } else {
                                    setFaceImage(result);
                                    nextReplaceRef.current = 'target';
                                }
                            }
                        };
                        reader.readAsDataURL(file);
                        return;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [targetImage, faceImage, setTargetImage, setFaceImage]);

    const GroupSection = ({ children, title, className = '' }: { children: React.ReactNode, title: string, className?: string }) => (
        <div className={`group-section ${className}`}>
            <div className="section-header">
                <span className="block-title">{title}</span>
            </div>
            <div className="section-content-wrapper">
                <div className="section-glow"></div>
                <div className="section-content">
                    {children}
                </div>
            </div>
        </div>
    );

    const PremiumUploadBox = ({ label, image, setImage, hint, placeholder }: { label: string, image: string | null, setImage: (v: string | null) => void, hint?: string, placeholder?: string }) => {
        const inputRef = useRef<HTMLInputElement>(null);

        const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => setImage(e.target?.result as string);
                reader.readAsDataURL(file);
            }
        };

        return (
            <div className="upload-card-large" onClick={() => !image && inputRef.current?.click()}>
                {image ? (
                    <div className="preview-large-box">
                        <img src={image} className="large-thumb" />
                        <button className="remove-btn-floating" onClick={(e) => { e.stopPropagation(); setImage(null); }}>
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="empty-large-state">
                        <Upload size={24} strokeWidth={1.5} className="upload-icon-large" />
                        <span className="upload-text-large">{placeholder || "点击上传图片"}</span>
                        <span className="upload-hint-large">{hint}</span>
                    </div>
                )}
                <input type="file" ref={inputRef} hidden accept="image/*" onChange={handleFile} />
            </div>
        );
    };

    return (
        <div className="editor-container face-swap-editor">
            <h2 className="main-title">AI FACE SWAP</h2>

            <div className="blocks-layout">

                {/* BLOCK 1: BASE IMAGE */}
                <GroupSection title="01. 底图 (BASE IMAGE)" className="flex-1">
                    <PremiumUploadBox
                        label=""
                        placeholder="点击 / 粘贴底图"
                        hint="决定构图与画风"
                        image={targetImage}
                        setImage={setTargetImage}
                    />
                </GroupSection>

                {/* BLOCK 2: FACE REF */}
                <GroupSection title="02. 脸部参考 (FACE REF)" className="flex-1">
                    <PremiumUploadBox
                        label=""
                        placeholder="点击 / 粘贴脸部图"
                        hint="决定五官特征"
                        image={faceImage}
                        setImage={setFaceImage}
                    />
                </GroupSection>

                {/* BLOCK 3: PROMPT */}
                <GroupSection title="03. 补充指令 (EXTRA PROMPT)" className="flex-1">
                    <div className="prompt-input-area">
                        <Sparkles size={12} className="prompt-icon" />
                        <textarea
                            value={extraPrompt}
                            onChange={(e) => setExtraPrompt(e.target.value)}
                            placeholder="例如: 微笑着, 眼神看向左侧..."
                            className="magic-textarea"
                        />
                    </div>
                </GroupSection>

            </div>

            <div className="footer-actions">
                <div className="control-row">
                    <span className="control-label">输出分辨率</span>
                    <div className="resolution-options">
                        {['1K', '2K', '4K'].map((res) => (
                            <button
                                key={res}
                                className={`res-btn ${imageSize === res ? 'active' : ''}`}
                                onClick={() => setImageSize(res)}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={!canGenerate || isGenerating}
                    className={`bake-btn ${canGenerate ? 'primary' : ''}`}
                >
                    {isGenerating ? '正在融合...' : `开始融合 (消耗 ${getCost()} 积分)`}
                </button>
            </div>

            <style jsx global>{`
                .face-swap-editor { 
                    display: flex; flex-direction: column; height: 100%; 
                    flex: 1; min-height: 0;
                    font-family: var(--font-sans);
                    padding: 8px; gap: 12px;
                    overflow: hidden;
                }
                .face-swap-editor .main-title {
                    font-size: 12px; font-weight: 800; color: #fff; letter-spacing: 0.1em;
                    margin-bottom: 8px; opacity: 0.5; text-transform: uppercase;
                    padding-left: 4px; flex-shrink: 0;
                }

                .face-swap-editor .blocks-layout {
                    flex: 1; min-height: 0;
                    display: grid;
                    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
                    gap: 16px;
                    overflow: hidden; padding-right: 4px;
                    height: 100%;
                }

                /* Group Section */
                .face-swap-editor .group-section {
                    display: flex; flex-direction: column; gap: 6px;
                    min-height: 0;
                    height: 100%;
                }
                .face-swap-editor .group-section.flex-1 { 
                    flex: 1; 
                    min-height: 0;
                }
                /* If screen is tall, they expand. If image is huge, they SHOULD NOT expand beyond flex share */
                
                .face-swap-editor .section-header { padding-left: 2px; flex-shrink: 0; }
                .face-swap-editor .block-title {
                    font-size: 11px; font-weight: 800; color: #fff; opacity: 0.7;
                    letter-spacing: 0.1em; text-transform: uppercase;
                }

                .face-swap-editor .section-content-wrapper {
                    position: relative; flex: 1; display: flex;
                    border-radius: 8px; min-height: 0; 
                    height: 100%;
                }
                .face-swap-editor .section-glow {
                    position: absolute; inset: -1px;
                    background: linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(139,92,246,0.3) 100%);
                    border-radius: 9px; opacity: 0; filter: blur(8px);
                    transition: opacity 0.3s; pointer-events: none;
                }
                .face-swap-editor .section-content-wrapper:hover .section-glow { opacity: 0.4; }

                .face-swap-editor .section-content {
                    position: relative; z-index: 1; flex: 1;
                    background: #111; /* Dark bg */
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex; flex-direction: column;
                }

                /* Upload Card Large */
                .face-swap-editor .upload-card-large {
                    flex: 1; display: flex; flex-direction: column;
                    cursor: pointer; position: relative;
                    min-height: 0;
                    width: 100%; height: 100%; /* Ensure it fills parent */
                    overflow: hidden;
                }
                
                .face-swap-editor .empty-large-state {
                    flex: 1; display: flex; flex-direction: column; 
                    align-items: center; justify-content: center; gap: 8px;
                    color: #555;
                }
                .face-swap-editor .upload-icon-large { opacity: 0.5; margin-bottom: 4px; }
                .face-swap-editor .upload-text-large { font-size: 12px; font-weight: 600; color: #888; }
                .face-swap-editor .upload-hint-large { font-size: 10px; color: #444; }

                .face-swap-editor .preview-large-box {
                    /* ABSOLUTE POSITIONING FIX to prevent blowout */
                    position: absolute; 
                    inset: 0;
                    background: #000; 
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden;
                }
                .face-swap-editor .large-thumb {
                    width: 100%; height: 100%;
                    object-fit: contain; display: block;
                }

                .face-swap-editor .remove-btn-floating {
                    position: absolute; top: 8px; right: 8px;
                    width: 24px; height: 24px; background: rgba(0,0,0,0.6);
                    border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; cursor: pointer; transition: all 0.2s;
                    z-index: 10;
                }
                .face-swap-editor .remove-btn-floating:hover { background: #ef4444; border-color: #ef4444; }

                /* Prompt Area */
                .face-swap-editor .prompt-input-area {
                    flex: 1; background: rgba(0,0,0,0.2);
                    display: flex; flex-direction: column; padding: 12px;
                    position: relative;
                }
                .face-swap-editor .prompt-icon { position: absolute; top: 12px; left: 12px; color: #888; opacity: 0.5; }
                .face-swap-editor .magic-textarea {
                    flex: 1; width: 100%; background: transparent; border: none;
                    color: #ccc; font-size: 13px; line-height: 1.6; resize: none;
                    padding-left: 20px; /* Space for icon */
                }
                .face-swap-editor .magic-textarea:focus { outline: none; }
                .face-swap-editor .magic-textarea::placeholder { color: #444; }

                /* Footer */
                .face-swap-editor .footer-actions { 
                    padding-top: 12px; 
                    border-top: 1px solid rgba(255,255,255,0.05); 
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .face-swap-editor .control-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .face-swap-editor .control-label {
                    font-size: 11px; color: #888; text-transform: uppercase;
                }
                .face-swap-editor .resolution-options {
                    display: flex; gap: 4px;
                    background: #111; padding: 2px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);
                }
                .face-swap-editor .res-btn {
                    background: transparent; border: none; color: #666;
                    font-size: 10px; padding: 4px 8px; border-radius: 4px;
                    cursor: pointer; transition: all 0.2s;
                }
                .face-swap-editor .res-btn:hover { color: #fff; }
                .face-swap-editor .res-btn.active {
                    background: #333; color: #fff; font-weight: 600;
                }

                .face-swap-editor .bake-btn {
                    width: 100%; height: 44px;
                    background: #222; border: 1px solid rgba(255,255,255,0.1);
                    color: #888; border-radius: 6px;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s;
                }
                .face-swap-editor .bake-btn.primary {
                    background: #fff; color: #000; border-color: #fff;
                }
                .face-swap-editor .bake-btn.primary:hover {
                    background: #eee;
                }

            `}</style>
        </div>
    );
}
