import { VIEW_PROMPTS } from '@/lib/viewPrompts';
import { useState } from 'react';
import { DigitalPersona } from '@/interface/types/persona_types';

interface Props {
    persona: DigitalPersona | null;
    uploadedImage?: string | null;
}

export function PersonaResult({ persona, uploadedImage }: Props) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [extractedAssets, setExtractedAssets] = useState<{ headshot: string, turnaround: string } | null>(null);
    const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("4K");

    // Generation Settings
    const [aspectRatio, setAspectRatio] = useState<string>("1:1");
    // This is for the *generation* resolution, separate from extraction resolution
    const [genResolution, setGenResolution] = useState<"1K" | "2K" | "4K">("1K");

    // Reset internal state if external props change (new generation/upload)
    // Actually, we should be careful. If persona changes, resultImage cleared.
    // If uploadedImage changes, we should probably clear extractedAssets if desired, but user might want to keep history?
    // Let's rely on parent to clear if needed, or simple effect.
    // For now, simple logic:

    // Determine the effective image to show: Uploaded > Generated
    // If uploadedImage is present, we are in "Image Mode".
    const activeImage = uploadedImage || resultImage;
    const isImageMode = !!uploadedImage;

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
                    image_size: genResolution,
                    aspect_ratio: aspectRatio
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

    const handleExtract = async (mode: 'all' | 'headshot' | 'turnaround' = 'all') => {
        if (!activeImage) return;
        setIsExtracting(true);

        const tasks = [];

        if (mode === 'all' || mode === 'headshot') {
            tasks.push({
                name: 'Headshot Grid',
                key: 'headshot',
                payload: {
                    prompt: VIEW_PROMPTS.HEADSHOT_GRID,
                    aspect_ratio: "1:1",
                    image_size: resolution,
                    images: [activeImage],
                }
            });
        }

        if (mode === 'all' || mode === 'turnaround') {
            tasks.push({
                name: 'Turnaround Sheet',
                key: 'turnaround',
                payload: {
                    prompt: VIEW_PROMPTS.TURNAROUND_SHEET,
                    aspect_ratio: "4:3",
                    image_size: resolution,
                    images: [activeImage]
                }
            });
        }

        try {
            // Run in parallel
            const results = await Promise.all(tasks.map(task =>
                fetch('/api/py/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task.payload)
                }).then(async res => {
                    if (!res.ok) throw new Error(`${task.name} failed`);
                    const data = await res.json();
                    return { key: task.key, data: data.image_data };
                })
            ));

            console.log("Extraction complete", results);

            // Merge new results with existing assets
            setExtractedAssets(prev => {
                const newAssets: any = { ...prev };
                results.forEach(r => {
                    if (r.data) newAssets[r.key] = r.data;
                });
                return newAssets as { headshot: string, turnaround: string };
            });

        } catch (e: any) {
            console.error(e);
            alert(`Extraction failed: ${e.message}`);
        } finally {
            setIsExtracting(false);
        }
    };

    if (!persona && !uploadedImage) {
        return null;
    }

    const isTechnicalMode = !!extractedAssets;

    const getCost = () => {
        if (genResolution === '4K') return 5;
        if (genResolution === '2K') return 2;
        return 1;
    };

    return (
        <div className={`result-container ${isTechnicalMode ? 'mode-technical' : ''}`}>

            {/* Left Pane: Original Persona */}
            <div className="pane-original">
                {!isImageMode && (
                    <div className="control-section">
                        {/* Generation Settings Row */}
                        <div className="settings-row">
                            <div className="settings-group">
                                <label>比例</label>
                                <div className="ratio-grid">
                                    {['1:1', '4:3', '3:4', '16:9', '9:16'].map((r) => (
                                        <button
                                            key={r}
                                            className={`ratio-btn ${aspectRatio === r ? 'active' : ''}`}
                                            onClick={() => setAspectRatio(r as any)}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="settings-group">
                                <label>分辨率</label>
                                <div className="ratio-grid">
                                    {['1K', '2K', '4K'].map((r) => (
                                        <button
                                            key={r}
                                            className={`ratio-btn ${genResolution === r ? 'active' : ''}`}
                                            onClick={() => setGenResolution(r as any)}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="control-bar">
                            <div className="status-text">
                                <span className="ready-text">准备生成。</span> 消耗: {getCost()} 积分
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="gen-btn"
                            >
                                {isGenerating ? '渲染中...' : '生成'}
                            </button>
                        </div>
                    </div>
                )}

                {isImageMode && (
                    <div className="control-bar image-mode-bar">
                        <div className="status-text">
                            <span className="ready-text">参考图已加载。</span>
                        </div>
                        <div className="badge">Image-to-Image</div>
                    </div>
                )}

                <div className="canvas">
                    {isGenerating && (
                        <div className="loading-overlay">
                            <div className="spinner" />
                            <p className="loading-text">Vertex AI 正在构想...</p>
                        </div>
                    )}

                    {activeImage ? (
                        <img src={activeImage} alt="Generated Persona" className="result-img" />
                    ) : (
                        <div className="placeholder">
                            <div className="icon">📸</div>
                            <p>暂无预览</p>
                        </div>
                    )}
                </div>

                {/* Extraction Toolbar */}
                {activeImage && (
                    <div className="extraction-bar">
                        <div className="info">
                            <strong>工业级提取</strong>
                            <span>将当前形象转为 {resolution} 技术资产</span>
                        </div>

                        <div className="right-controls">
                            <select
                                className="resolution-select"
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value as any)}
                            >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>

                            {/* [NEW] Individual Buttons */}
                            <button
                                onClick={() => handleExtract('headshot')}
                                disabled={isExtracting}
                                className="extract-btn secondary"
                                title="提取面部四视图"
                            >
                                👤 面部
                            </button>

                            <button
                                onClick={() => handleExtract('turnaround')}
                                disabled={isExtracting}
                                className="extract-btn secondary"
                                title="提取全身三视图"
                            >
                                🧍 全身
                            </button>

                            {/* Existing One-Click Button */}
                            <button
                                onClick={() => handleExtract('all')}
                                disabled={isExtracting}
                                className="extract-btn primary"
                                title="一键提取所有视图"
                            >
                                {isExtracting ? (
                                    <span className="flex-center">
                                        <span className="mini-spinner"></span> 提取中...
                                    </span>
                                ) : '✨ 一键生成'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Pane: Technical Assets (Only in Technical Mode) */}
            {extractedAssets && (
                <div className="pane-technical">
                    {/* 1. Turnaround Sheet (Primary - Huge) */}
                    {extractedAssets.turnaround && (
                        <div className="tech-asset primary">
                            <div className="asset-header">
                                <span className="badge">{resolution}</span> Turnaround Sheet (Full Body)
                            </div>
                            <img src={extractedAssets.turnaround} className="tech-img" />
                        </div>
                    )}

                    {/* 2. Headshot Grid (Secondary - Independent) */}
                    {extractedAssets.headshot && (
                        <div className="tech-asset secondary">
                            <div className="asset-header">
                                <span className="badge">{resolution}</span> Technical Headshot Grid
                            </div>
                            <img src={extractedAssets.headshot} className="tech-img" />
                        </div>
                    )}
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
            
            /* Add padding bottom to allow scrolling past the content */
            padding-bottom: 80px;

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
        .mode-technical .pane-original .settings-row {
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
        .image-mode-bar .badge {
            background: #8b5cf6;
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
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
        .control-section {
            background: var(--bg-panel);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        .settings-row {
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .settings-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .settings-group label {
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
        }
        .ratio-grid {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }
        .ratio-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid transparent;
            color: var(--text-secondary);
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            flex: 1;
            text-align: center;
        }
        .ratio-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        .ratio-btn.active {
            background: var(--accent-blue);
            color: white;
            border-color: var(--accent-blue);
        }

        .control-bar {
            width: 100%;
            padding: 10px 12px; 
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
            padding: 8px 16px; /* Slightly reduced padding */
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap; /* Prevent wrap */
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
        
        /* Apply dynamic aspect ratio to canvas */
        .canvas {
             aspect-ratio: ${aspectRatio.replace(':', '/')};
             transition: aspect-ratio 0.3s ease;
        }

        .result-img {
            width: 100%;
            height: 100%;
            object-fit: contain; /* Ensure full image is seen in non-square ratios */
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
            padding: 8px 12px; /* Reduce padding slightly */
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideUp 0.5s ease-out;
            gap: 12px; 
            flex-wrap: wrap; 
        }
        .extraction-bar .info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            /* Allow info to shrink if needed, but keep some width */
            flex: 1 1 120px; 
        }
        .extraction-bar strong {
            color: #fff;
            font-size: 14px;
            white-space: nowrap;
        }
        .extraction-bar span {
            color: #666;
            font-size: 11px;
            white-space: nowrap;
        }
        
        .right-controls {
            display: flex;
            align-items: center;
            gap: 6px; /* Tighten gap */
            flex-wrap: wrap; /* Allow controls themselves to wrap if extremely tight */
            justify-content: flex-end;
            flex: 2 1 auto; /* Allow controls to take more space */
        }

        .resolution-select {
            background: #222;
            color: #fff;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            transition: all 0.2s;
        }
        .resolution-select:hover {
            border-color: #666;
            background: #2a2a2a;
        }

        .extract-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 12px; /* Smaller horizontal padding */
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .extract-btn.secondary {
            background: #333;
            border: 1px solid #444;
        }
        .extract-btn.secondary:hover {
            background: #444;
            border-color: #666;
        }
        .extract-btn.primary:hover {
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
