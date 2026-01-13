'use client';

import React from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { Copy } from 'lucide-react';

export default function PromptPreview() {
    const currentPrompt = useStudioStore((state) => state.currentPrompt);
    const setPrompt = useStudioStore((state) => state.setPrompt);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentPrompt);
    };

    return (
        <div className="prompt-preview">
            <div className="preview-header">
                <span className="label">Prompt Editor</span>
                <button className="copy-btn" onClick={handleCopy} title="Copy Prompt">
                    <Copy size={12} />
                </button>
            </div>
            <div className="preview-content">
                <textarea
                    className="prompt-textarea"
                    value={currentPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter custom prompt here..."
                />
            </div>

            <style jsx>{`
                .prompt-preview {
                    margin-top: 20px;
                    border: 1px solid var(--accent-blue);
                    border-radius: 4px;
                    background: rgba(59, 130, 246, 0.05);
                    overflow: hidden;
                }
                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 8px;
                    background: rgba(59, 130, 246, 0.1);
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                }
                .label {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--accent-blue);
                    text-transform: uppercase;
                }
                .copy-btn {
                    background: transparent;
                    border: none;
                    color: var(--accent-blue);
                    cursor: pointer;
                    padding: 2px;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                }
                .copy-btn:hover {
                    background: rgba(59, 130, 246, 0.2);
                }
                .preview-content {
                    padding: 0;
                    font-size: 11px;
                    color: var(--text-secondary);
                    font-family: monospace;
                    line-height: 1.4;
                    height: 150px;
                    overflow: hidden;
                }
                .prompt-textarea {
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    padding: 8px;
                    font-size: 11px;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                }
                .prompt-textarea:focus {
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
}
