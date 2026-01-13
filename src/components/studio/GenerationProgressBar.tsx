'use client';

import React from 'react';
import { useStudioStore } from '@/store/useStudioStore';

export default function GenerationProgressBar() {
    const isGenerating = useStudioStore((state) => state.isGenerating);
    const status = useStudioStore((state) => state.generationStatus);
    const progress = useStudioStore((state) => state.generationProgress);

    // Only show when generating or when there is a status message (e.g. error or completion briefly)
    if (!isGenerating && status === 'Ready') return null;

    return (
        <div className="progress-container">
            <div className="status-row">
                <span className="status-text">{status}</span>
                <span className="percentage">{Math.round(progress)}%</span>
            </div>
            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <style jsx>{`
                .progress-container {
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    animation: fadeIn 0.3s ease;
                }
                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .status-text {
                    font-size: 10px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .percentage {
                    font-size: 10px;
                    color: var(--accent-blue);
                    font-family: monospace;
                }
                .progress-track {
                    width: 100%;
                    height: 2px;
                    background: var(--control-bg);
                    border-radius: 2px;
                    overflow: hidden;
                    position: relative;
                }
                .progress-fill {
                    height: 100%;
                    background: var(--accent-blue);
                    transition: width 0.3s ease-out;
                    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
