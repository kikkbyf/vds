'use client';

import React, { useMemo } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { Copy } from 'lucide-react';
import { generatePrompt } from '@/utils/promptUtils';

export default function PromptPreview() {
    const shotPreset = useStudioStore((state) => state.shotPreset);
    const lightingPreset = useStudioStore((state) => state.lightingPreset);
    const focalLength = useStudioStore((state) => state.focalLength);

    const fullPrompt = useMemo(() => {
        return generatePrompt(shotPreset, focalLength, lightingPreset);
    }, [shotPreset, lightingPreset, focalLength]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullPrompt);
        // Could add a toast notification here if we had a toast system
    };

    return (
        <div className="prompt-preview">
            <div className="preview-header">
                <span className="label">Prompt Preview</span>
                <button className="copy-btn" onClick={handleCopy} title="Copy Prompt">
                    <Copy size={12} />
                </button>
            </div>
            <div className="preview-content">
                {fullPrompt}
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
                    padding: 8px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    font-family: monospace;
                    white-space: pre-wrap;
                    line-height: 1.4;
                    max-height: 150px;
                    overflow-y: auto;
                }
            `}</style>
        </div>
    );
}
