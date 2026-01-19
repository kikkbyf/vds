import { VIEW_PROMPTS } from '@/lib/viewPrompts';
import { useState } from 'react';
import { DigitalPersona } from '@/interface/types/persona_types';

interface Props {
    persona: DigitalPersona | null;
}

export function PersonaResult({ persona }: Props) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [extractedAssets, setExtractedAssets] = useState<{ headshot: string, turnaround: string } | null>(null);

    const handleGenerate = async () => {
        if (!persona) return;
        setIsGenerating(true);
        setResultImage(null);

        try {
            const res = await fetch('/api/py/generate_persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: persona,
                    image_size: "1K", // Default
                    aspect_ratio: "1:1" // Default
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || 'Generation failed');
            }

            const data = await res.json();
            setResultImage(data.image_data);

        } catch (e: any) {
            console.error(e);
            alert(`Generation failed: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExtract = async () => {
        if (!resultImage) return;
        setIsExtracting(true);

        const tasks = [
            {
                name: 'Headshot Grid',
                payload: {
                    prompt: VIEW_PROMPTS.HEADSHOT_GRID,
                    aspect_ratio: "1:1",
                    image_size: "4K",
                    images: [resultImage],
                    // Use a recognizable prefix in negative prompt if needed, or keep standard
                }
            },
            {
                name: 'Turnaround Sheet',
                payload: {
                    prompt: VIEW_PROMPTS.TURNAROUND_SHEET,
                    aspect_ratio: "4:3",
                    image_size: "4K",
                    images: [resultImage]
                }
            }
        ];

        try {
            // Run in parallel
            const results = await Promise.all(tasks.map(task =>
                fetch('/api/py/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task.payload)
                }).then(async res => {
                    if (!res.ok) throw new Error(`${task.name} failed`);
                    return res.json();
                })
            ));

            console.log("Extraction complete", results);

            if (results[0]?.image_data && results[1]?.image_data) {
                setExtractedAssets({
                    headshot: results[0].image_data,
                    turnaround: results[1].image_data
                });
                // alert("成功提取 2 套 4K 视觉资产！已同步至作品库 (Library)。");
            }

        } catch (e: any) {
            console.error(e);
            alert(`Extraction failed: ${e.message}`);
        } finally {
            setIsExtracting(false);
        }
    };

    if (!persona) {
        return null;
    }

    const isTechnicalMode = !!extractedAssets;

    return (
        <div className={`result-container ${isTechnicalMode ? 'mode-technical' : ''}`}>

            {/* Left Pane: Original Persona */}
            <div className="pane-original">
                <div className="control-bar">
                    <div className="status-text">
                        <span className="ready-text">准备生成。</span> 消耗: 1 积分
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="gen-btn"
                    >
                        {isGenerating ? '渲染中...' : '生成 (1K)'}
                    </button>
                </div>

                <div className="canvas">
                    {isGenerating && (
                        <div className="loading-overlay">
                            <div className="spinner" />
                            <p className="loading-text">Vertex AI 正在构想...</p>
                        </div>
                    )}

                    {resultImage ? (
                        <img src={resultImage} alt="Generated Persona" className="result-img" />
                    ) : (
                        <div className="placeholder">
                            <div className="icon">📸</div>
                            <p>暂无预览</p>
                        </div>
                    )}
                </div>

                {/* Extraction Toolbar - Hide in Technical Mode to reduce clutter, or keep? */}
                {resultImage && !extractedAssets && (
                    <div className="extraction-bar">
                        <div className="info">
                            <strong>工业级提取</strong>
                            <span>将当前形象转为 4K 技术资产</span>
                        </div>
                        <button
                            onClick={handleExtract}
                            disabled={isExtracting}
                            className="extract-btn"
                        >
                            {isExtracting ? (
                                <span className="flex-center">
                                    <span className="mini-spinner"></span> 提取中 (4K x2)...
                                </span>
                            ) : '✨ 一键生成视图'}
                        </button>
                    </div>
                )}
            </div>

            {/* Right Pane: Technical Assets (Only in Technical Mode) */}
            {extractedAssets && (
                <div className="pane-technical">
                    {/* 1. Turnaround Sheet (Primary - Huge) */}
                    <div className="tech-asset primary">
                        <div className="asset-header">
                            <span className="badge">4K</span> Turnaround Sheet (Full Body)
                        </div>
                        <img src={extractedAssets.turnaround} className="tech-img" />
                    </div>

                    {/* 2. Headshot Grid (Secondary - Independent) */}
                    <div className="tech-asset secondary">
                        <div className="asset-header">
                            <span className="badge">4K</span> Technical Headshot Grid
                        </div>
                        <img src={extractedAssets.headshot} className="tech-img" />
                    </div>
                </div>
            )}

            <style jsx>{`
        /* ... (existing styles) */
        .result-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
            max-width: 600px;
            transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .result-container.mode-technical {
            flex-direction: row;
            max-width: 100%; 
            padding-right: 20px;
            align-items: flex-start;
            margin: 0 auto; /* Center in scrollable viewport */
        }

        .pane-original {
            display: flex;
            flex-direction: column;
            gap: 24px;
            flex: 1;
            width: 100%;
            transition: all 0.5s ease;
        }
        
        /* Shrunk sidebar in technical mode */
        .mode-technical .pane-original {
            flex: 0 0 220px !important; /* Force shrink */
            width: 220px !important;
            min-width: 220px;
            position: sticky;
            top: 24px;
        }
        /* Hide extra details in sidebar to clean it up */
        .mode-technical .pane-original .status-text {
            display: none;
        }
        
        .pane-technical {
            flex: 3;
            display: flex;
            flex-direction: column; /* Vertical Stack for big images */
            gap: 40px; /* Space between assets */
            opacity: 0;
            animation: fadeIn 0.8s forwards 0.3s;
            min-width: 0; /* Prevent flex overflow */
        }

        .tech-asset {
            background: #000;
            border: 1px solid #333;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        
        .tech-asset.primary {
            /* Special styling for the main asset if needed */
        }

        .asset-header {
            padding: 12px 16px;
            background: #0a0a0a;
            border-bottom: 1px solid #222;
            font-size: 13px;
            font-weight: 500;
            color: #888;
            display: flex;
            align-items: center;
            gap: 8px;
            letter-spacing: 0.05em;
        }
        .badge {
            background: #2563eb;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            box-shadow: 0 0 10px rgba(37,99,235,0.4);
        }
        .tech-img {
            width: 100%;
            height: auto;
            display: block;
            transition: transform 0.3s;
        }
        .tech-img:hover {
            /* Subtle interaction hint */
        }
        .control-bar {
            width: 100%;
            background: var(--bg-panel);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 6px 6px 6px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .status-text {
            font-size: 12px;
            color: var(--text-secondary);
        }
        .ready-text {
            color: var(--text-primary);
            font-weight: 500;
        }
        .gen-btn {
            background: var(--text-primary);
            color: black;
            padding: 8px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        .gen-btn:hover {
            background: white;
            transform: scale(1.02);
        }
        .gen-btn:disabled {
            opacity: 0.5;
            cursor: wait;
            transform: none;
        }
        .canvas {
            aspect-ratio: 1/1;
            width: 100%;
            background: var(--bg-panel);
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .result-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            animation: fadeIn 0.7s ease-out;
        }
        .placeholder {
            text-align: center;
            color: rgba(255,255,255,0.2);
        }
        .icon { font-size: 40px; margin-bottom: 8px; }
        .placeholder p { font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; }
        
        .loading-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(5px);
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .spinner {
            width: 30px; height: 30px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        .loading-text {
            color: rgba(255,255,255,0.8);
            font-size: 12px;
            animation: pulse 2s infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: 0.5; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Extraction Bar Styles */
        .extraction-bar {
            background: linear-gradient(90deg, #111 0%, #000 100%);
            border: 1px solid #333;
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideUp 0.5s ease-out;
        }
        .extraction-bar .info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .extraction-bar strong {
            color: #fff;
            font-size: 14px;
        }
        .extraction-bar span {
            color: #666;
            font-size: 11px;
        }
        .extract-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .extract-btn:hover {
            background: #1d4ed8;
        }
        .extract-btn:disabled {
            background: #1e3a8a;
            cursor: not-allowed;
            opacity: 0.8;
        }
        .mini-spinner {
            width: 12px; height: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }
        .flex-center {
            display: flex;
            align-items: center;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
       `}</style>
        </div>
    );
}
