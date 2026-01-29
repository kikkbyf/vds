'use client';

import { useState } from 'react';
import { FACE_SWAP_PROMPTS } from '@/lib/faceSwapPrompts';
import { VIEW_PROMPTS } from '@/lib/viewPrompts';
import { useStudioStore } from '@/store/useStudioStore';

interface Props {
    resultImage: string | null;
    isGenerating: boolean;
}

export function FaceSwapResult({ resultImage, isGenerating }: Props) {
    const { activeTasks } = useStudioStore();

    // Check for running Face Swap task
    const runningFaceSwapTask = activeTasks.find(t => t.type === 'faceswap' && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(t.status));

    // Check for completed Face Swap task (most recent one with a result)
    const completedFaceSwapTask = activeTasks.find(t => t.type === 'faceswap' && t.status === 'COMPLETED' && t.thumbnail);

    // Use either the prop or the completed task's thumbnail
    const displayImage = resultImage || completedFaceSwapTask?.thumbnail || null;

    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedAssets, setExtractedAssets] = useState<{ headshot: string, turnaround: string } | null>(null);
    const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("4K");

    // Reset extraction when resultImage changes? Optional, but good practice if new image comes.
    // For now simple.

    const { submitGenericTask } = useStudioStore();

    // Check for completed extraction tasks (same pattern as PersonaResult)
    const completedHeadshotTask = activeTasks.find(t =>
        t.type === 'extraction' &&
        t.status === 'COMPLETED' &&
        t.thumbnail &&
        t.name?.includes('Headshot')
    );
    const completedTurnaroundTask = activeTasks.find(t =>
        t.type === 'extraction' &&
        t.status === 'COMPLETED' &&
        t.thumbnail &&
        t.name?.includes('Turnaround')
    );

    // Derive extracted assets from completed tasks OR local state
    const derivedExtractedAssets = (completedHeadshotTask?.thumbnail || completedTurnaroundTask?.thumbnail)
        ? {
            headshot: completedHeadshotTask?.thumbnail || extractedAssets?.headshot || '',
            turnaround: completedTurnaroundTask?.thumbnail || extractedAssets?.turnaround || ''
        }
        : extractedAssets;

    // Check if any extraction is in progress
    const runningExtractionTask = activeTasks.find(t => t.type === 'extraction' && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(t.status));
    const isExtractingState = isExtracting || !!runningExtractionTask;

    const handleExtract = async (mode: 'all' | 'headshot' | 'turnaround' = 'all') => {
        if (!displayImage) return;
        setIsExtracting(true);

        const tasks = [];
        if (mode === 'all' || mode === 'headshot') {
            tasks.push({
                name: 'Headshot', key: 'headshot',
                endpoint: '/api/py/tasks/submit/generate',
                payload: { prompt: VIEW_PROMPTS.HEADSHOT_GRID, aspect_ratio: "1:1", image_size: resolution, images: [displayImage] }
            });
        }
        if (mode === 'all' || mode === 'turnaround') {
            tasks.push({
                name: 'Turnaround', key: 'turnaround',
                endpoint: '/api/py/tasks/submit/generate',
                payload: { prompt: VIEW_PROMPTS.TURNAROUND_SHEET, aspect_ratio: "4:3", image_size: resolution, images: [displayImage] }
            });
        }

        try {
            // Submit all tasks to queue
            for (const task of tasks) {
                await submitGenericTask(
                    task.endpoint,
                    task.payload,
                    'extraction',
                    `Extracting ${task.name}`
                );
            }
            // 任务已提交到队列，derivedExtractedAssets 会自动更新

        } catch (e: any) {
            alert(`Extraction submission failed: ${e.message}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const isTechnicalMode = !!derivedExtractedAssets;

    return (
        <div className={`result-container ${isTechnicalMode ? 'mode-technical' : ''}`}>

            {/* Left Pane: Result or Placeholder */}
            <div className="pane-original">
                <div className="canvas">
                    {/* Check for active task to keep loading state persistent */}
                    {(isGenerating || runningFaceSwapTask) && (
                        <div className="loading-overlay">
                            <div className="spinner" />
                            <p className="loading-text">正在融合特征...</p>

                            {runningFaceSwapTask && (
                                <div className="mt-4 w-64 max-w-[80%]">
                                    <div className="flex justify-between text-[10px] text-white/60 mb-1 uppercase tracking-wider">
                                        <span>{runningFaceSwapTask.message || "Processing..."}</span>
                                        <span>{Math.round(runningFaceSwapTask.progress)}%</span>
                                    </div>
                                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                            style={{ width: `${runningFaceSwapTask.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {displayImage ? (
                        <img src={displayImage} className="result-img" />
                    ) : (
                        <div className="placeholder">
                            <div className="icon">🎭</div>
                            <p>{(isGenerating || runningFaceSwapTask) ? 'AI 正在思考...' : '等待生成'}</p>
                        </div>
                    )}
                </div>

                {/* Extraction Toolbar (Only shows if result exists) */}
                {displayImage && (
                    <div className="extraction-bar">
// ... (rest is same)
                        <div className="info">
                            <strong>后续提取</strong>
                            <span>基于换脸结果生成技术资产</span>
                        </div>
                        <div className="right-controls">
                            <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="resolution-select">
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                            <button onClick={() => handleExtract('headshot')} disabled={isExtractingState} className="extract-btn secondary" title="提取头像">👤</button>
                            <button onClick={() => handleExtract('turnaround')} disabled={isExtractingState} className="extract-btn secondary" title="提取全身">🧍</button>
                            <button onClick={() => handleExtract('all')} disabled={isExtractingState} className="extract-btn primary">✨ 一键提取</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Pane: Extractions */}
            {extractedAssets && (
                <div className="pane-technical">
                    {extractedAssets.turnaround && (
                        <div className="tech-asset">
                            <div className="asset-header"><span className="badge">{resolution}</span> Turnaround Sheet</div>
                            <img src={extractedAssets.turnaround} className="tech-img" />
                        </div>
                    )}
                    {extractedAssets.headshot && (
                        <div className="tech-asset">
                            <div className="asset-header"><span className="badge">{resolution}</span> Headshot Grid</div>
                            <img src={extractedAssets.headshot} className="tech-img" />
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
            .result-container {
                display: flex; flex-direction: column; gap: 24px;
                width: 100%; max-width: 600px;
                transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
                margin: 0 auto;
            }
            .result-container.mode-technical {
                flex-direction: row; max-width: 100%; align-items: flex-start;
                padding-right: 20px;
            }
            
            .pane-original {
                flex: 1; display: flex; flex-direction: column; gap: 24px;
                width: 100%; transition: all 0.5s ease;
            }
            .mode-technical .pane-original {
                flex: 0 0 300px !important; width: 300px !important;
                position: sticky; top: 24px;
            }

            .pane-technical {
                flex: 3; display: flex; flex-direction: column; gap: 40px;
                animation: fadeIn 0.8s forwards 0.3s; opacity: 0; min-width: 0;
            }

            .control-bar {
                background: var(--bg-panel); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px; padding: 12px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .status-text { font-size: 12px; color: var(--text-secondary); }
            .gen-btn {
                background: var(--text-primary); color: black; padding: 8px 16px;
                border-radius: 8px; font-weight: 700; border: none; cursor: pointer;
            }
            .gen-btn:disabled { opacity: 0.5; }

            .canvas {
                aspect-ratio: 1/1; width: 100%; background: #000;
                border-radius: 16px; overflow: hidden; position: relative;
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .result-img { width: 100%; height: 100%; object-fit: contain; }
            .placeholder { text-align: center; color: rgba(255,255,255,0.2); }
            .icon { font-size: 40px; margin-bottom: 8px; }

            .loading-overlay {
                position: absolute; inset: 0; background: rgba(0,0,0,0.7);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                z-index: 10;
            }
            .spinner {
                width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.3);
                border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;
                margin-bottom: 12px;
            }
            .loading-text { font-size: 12px; color: #ccc; animation: pulse 2s infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes pulse { 50% { opacity: 0.5; } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

            /* Reuse extraction bar styles from PersonaResult ideally, simplified here */
            .extraction-bar {
                background: linear-gradient(90deg, #111, #000); border: 1px solid #333;
                border-radius: 12px; padding: 12px; display: flex;
                justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
            }
            .extraction-bar .info { display: flex; flex-direction: column; }
            .extraction-bar strong { color: white; font-size: 13px; }
            .extraction-bar span { color: #666; font-size: 11px; }
            .right-controls { display: flex; gap: 8px; }
            .extract-btn {
                padding: 6px 10px; border-radius: 6px; border: none; font-size: 12px; cursor: pointer;
            }
            .extract-btn.primary { background: #2563eb; color: white; }
            .extract-btn.secondary { background: #333; color: white; border: 1px solid #444; }
            .resolution-select { background: #222; color: white; border: 1px solid #444; border-radius: 6px; padding: 6px; }

            .tech-asset {
                background: #000; border: 1px solid #333; border-radius: 12px; overflow: hidden;
            }
            .asset-header {
                padding: 12px; background: #0a0a0a; border-bottom: 1px solid #222; color: #888; font-size: 13px;
                display: flex; align-items: center; gap: 8px;
            }
            .badge { background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; }
            .tech-img { width: 100%; display: block; }

            `}</style>
        </div>
    );
}
