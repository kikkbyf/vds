'use client';

import { useState } from 'react';

interface MagicInputProps {
    onSubmit: (text: string) => void;
    isLoading: boolean;
}

export function MagicInput({ onSubmit, isLoading }: MagicInputProps) {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmit(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
    };

    return (
        <div className="magic-input-container">
            <div className="glow-effect"></div>
            <div className="input-wrapper">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="描述你想创建的数字人... (例如：'2077年赛博朋克风格的冷酷侦探，义眼，雨夜')"
                    className="magic-textarea"
                    disabled={isLoading}
                />
                <div className="actions">
                    <span className="hint">按 ⌘ + Enter 生成</span>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !text.trim()}
                        className="magic-btn"
                    >
                        {isLoading ? '解析中...' : '智能填充 ✨'}
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
        .magic-input-container:hover .glow-effect {
            opacity: 0.6;
        }
        .input-wrapper {
            position: relative;
            z-index: 1;
            background: var(--bg-panel-header);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 4px;
        }
        .magic-textarea {
            width: 100%;
            min-height: 100px;
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
        .hint {
            font-size: 10px;
            color: rgba(255,255,255,0.3);
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
        .magic-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
      `}</style>
        </div>
    );
}
