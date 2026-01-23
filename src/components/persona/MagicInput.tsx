'use client';

import { useState, useRef, useEffect } from 'react';
import { Paperclip, X, Image as ImageIcon } from 'lucide-react';

interface MagicInputProps {
    onSubmit: (text: string, image?: string) => void; // Updated signature
    isLoading: boolean;
}

export function MagicInput({ onSubmit, isLoading }: MagicInputProps) {
    const [text, setText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!text.trim() && !image) return;
        onSubmit(text, image || undefined);
        setText('');
        setImage(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) processFile(file);
            }
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setImage(result);
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={`magic-input-container ${image ? 'has-image' : ''}`}>
            <div className="glow-effect"></div>
            <div className="input-wrapper">
                {image && (
                    <div className="image-preview-area">
                        <div className="thumb-container">
                            <img src={image} alt="Upload preview" className="thumb" />
                            <button onClick={clearImage} className="remove-btn">
                                <X size={12} />
                            </button>
                        </div>
                        <span className="mode-badge">已启用图生图模式</span>
                    </div>
                )}
                
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={image ? "添加额外描述 (可选)..." : "描述你想创建的数字人... (支持粘贴图片或点击下方图标上传)"}
                    className="magic-textarea"
                    disabled={isLoading}
                />
                <div className="actions">
                    <div className="left-tools">
                        <span className="hint">⌘ + Enter</span>
                        <button 
                            className="tool-btn" 
                            onClick={() => fileInputRef.current?.click()}
                            title="上传参考图"
                        >
                            <Paperclip size={16} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                    </div>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || (!text.trim() && !image)}
                        className={`magic-btn ${image ? 'btn-confirm' : ''}`}
                    >
                        {isLoading ? '处理中...' : (image ? '确认使用此图' : '智能填充 ✨')}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .magic-input-container {
            position: relative;
            margin-bottom: 24px;
        }
        .glow-effect {
            position: absolute;
            top: -2px; left: -2px; right: -2px; bottom: -2px;
            background: linear-gradient(to right, #ec4899, #8b5cf6);
            border-radius: 10px;
            opacity: 0.3;
            filter: blur(8px);
            z-index: 0;
            transition: opacity 0.3s;
        }
        .magic-input-container:hover .glow-effect,
        .magic-input-container.has-image .glow-effect {
            opacity: 0.6;
        }
        .input-wrapper {
            position: relative;
            z-index: 1;
            background: var(--bg-panel-header);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 4px;
            display: flex;
            flex-direction: column;
        }
        .image-preview-area {
            padding: 12px 12px 0;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 12px;
        }
        .thumb-container {
            position: relative;
            width: 60px;
            height: 60px;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .thumb {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .remove-btn {
            position: absolute;
            top: 2px;
            right: 2px;
            background: rgba(0,0,0,0.6);
            color: white;
            border: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .mode-badge {
            font-size: 11px;
            color: #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(139, 92, 246, 0.2);
        }
        .magic-textarea {
            width: 100%;
            min-height: 80px;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-family: var(--font-sans);
            font-size: 14px;
            padding: 12px;
            resize: none;
        }
        .magic-textarea:focus {
            outline: none;
        }
        .magic-textarea::placeholder {
            color: rgba(255,255,255,0.3);
        }
        .actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .left-tools {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .hint {
            font-size: 10px;
            color: rgba(255,255,255,0.3);
        }
        .tool-btn {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.5);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .tool-btn:hover {
            color: white;
            background: rgba(255,255,255,0.1);
        }
        
        .magic-btn {
            background: var(--text-primary);
            color: black;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .magic-btn:hover {
            background: white;
            transform: translateY(-1px);
        }
        .magic-btn.btn-confirm {
            background: #8b5cf6;
            color: white;
        }
        .magic-btn.btn-confirm:hover {
            background: #7c3aed;
        }
        .magic-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
      `}</style>
        </div>
    );
}
