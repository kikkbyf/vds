'use client';

import { Paperclip, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
    targetImage: string | null;
    setTargetImage: (img: string | null) => void;
    faceImage: string | null;
    setFaceImage: (img: string | null) => void;
    extraPrompt: string;
    setExtraPrompt: (text: string) => void;
}

export function FaceSwapEditor({
    targetImage, setTargetImage,
    faceImage, setFaceImage,
    extraPrompt, setExtraPrompt
}: Props) {

    const UploadBox = ({ label, image, setImage }: { label: string, image: string | null, setImage: (v: string | null) => void }) => {
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
            <div className="upload-group">
                <label>{label}</label>
                <div
                    className={`uploader ${image ? 'has-image' : ''}`}
                    onClick={() => !image && inputRef.current?.click()}
                >
                    {image ? (
                        <>
                            <img src={image} className="preview" />
                            <button className="clear-btn" onClick={(e) => { e.stopPropagation(); setImage(null); }}>
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <div className="placeholder">
                            <Paperclip size={20} />
                            <span>点击上传</span>
                        </div>
                    )}
                    <input type="file" ref={inputRef} hidden accept="image/*" onChange={handleFile} />
                </div>
            </div>
        );
    };

    return (
        <div className="editor-container">
            <div className="section">
                <h3>01. 上传素材 (Upload Assets)</h3>
                <UploadBox label="底图 (Base Image)" image={targetImage} setImage={setTargetImage} />
                <UploadBox label="脸部参考 (Face Ref)" image={faceImage} setImage={setFaceImage} />
                <div style={{ padding: '0 4px' }}>
                    <p style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                        * 底图决定画风/光影/构图，脸部决定五官特征。
                    </p>
                </div>
            </div>

            <div className="section">
                <h3>02. 补充指令 (Extra Prompt)</h3>
                <div className="input-group">
                    <label>自定义描述 (例如: 微笑, 眼神看向左边, 赛博朋克光效...)</label>
                    <textarea
                        value={extraPrompt}
                        onChange={(e) => setExtraPrompt(e.target.value)}
                        placeholder="在此输入补充指令..."
                        className="extra-textarea"
                    />
                </div>
            </div>

            <style jsx>{`
        .editor-container { padding-bottom: 40px; }
        .section { margin-bottom: 32px; animation: fadeIn 0.5s ease-out; }
        h3 {
            font-size: 12px; font-weight: bold; color: var(--text-primary);
            margin-bottom: 16px; padding-left: 8px; border-left: 3px solid #3b82f6;
            text-transform: uppercase; letter-spacing: 0.1em;
        }
        .upload-group { margin-bottom: 16px; }
        label {
            display: block; font-size: 10px; text-transform: uppercase;
            font-weight: 700; color: var(--text-muted); margin-bottom: 6px;
            letter-spacing: 0.05em;
        }
        .uploader {
            width: 100%; aspect-ratio: 16/9;
            background: #1a1a1a; border: 1px dashed rgba(255,255,255,0.2);
            border-radius: 8px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; position: relative; overflow: hidden;
        }
        .uploader:hover { border-color: rgba(255,255,255,0.4); background: #222; }
        .uploader.has-image { border-style: solid; border-color: rgba(255,255,255,0.1); cursor: default; }
        
        .preview { width: 100%; height: 100%; object-fit: contain; background: #000; }
        .placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #555; }
        .placeholder span { font-size: 12px; }
        
        .clear-btn {
            position: absolute; top: 8px; right: 8px;
            background: rgba(0,0,0,0.6); color: white; border: none;
            width: 24px; height: 24px; border-radius: 50%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .clear-btn:hover { background: #ef4444; }

        .extra-textarea {
            width: 100%; min-height: 100px;
            background: #222; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px; padding: 12px;
            font-size: 13px; color: var(--text-primary); font-family: var(--font-sans);
            resize: vertical;
        }
        .extra-textarea:focus { outline: none; border-color: #3b82f6; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
