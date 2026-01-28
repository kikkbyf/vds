'use client';

import React from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useFaceModelStore } from '@/store/useFaceModelStore';
import ImageUploader from './ImageUploader';
import PromptPreview from './PromptPreview';
import PromptManager from '../inspector/PromptManager';
import GenerationProgressBar from '../studio/GenerationProgressBar';
import { Layers, Box, FolderDown } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';

export default function Inspector() {
    const focalLength = useStudioStore((state) => state.focalLength);
    const setFocalLength = useStudioStore((state) => state.setFocalLength);

    const shotPreset = useStudioStore((state) => state.shotPreset);

    // Asset Store
    const groups = useAssetStore((state) => state.groups);
    const setShotPreset = useStudioStore((state) => state.setShotPreset);

    const lightingPreset = useStudioStore((state) => state.lightingPreset);
    const setLightingPreset = useStudioStore((state) => state.setLightingPreset);

    const viewMode = useStudioStore((state) => state.viewMode);
    const setViewMode = useStudioStore((state) => state.setViewMode);

    const generateImage = useStudioStore((state) => state.generateImage);
    const isGenerating = useStudioStore((state) => state.isGenerating);
    const uploadedImages = useStudioStore((state) => state.uploadedImages);
    const removeUploadedImage = useStudioStore((state) => state.removeUploadedImage);
    const getScreenshot = useStudioStore((state) => state.getScreenshot);

    // Generation Settings
    const aspectRatio = useStudioStore((state) => state.aspectRatio);
    const setAspectRatio = useStudioStore((state) => state.setAspectRatio);
    const imageSize = useStudioStore((state) => state.imageSize);
    const setImageSize = useStudioStore((state) => state.setImageSize);
    const guidanceScale = useStudioStore((state) => state.guidanceScale);
    const setGuidanceScale = useStudioStore((state) => state.setGuidanceScale);
    const negativePrompt = useStudioStore((state) => state.negativePrompt);
    const setNegativePrompt = useStudioStore((state) => state.setNegativePrompt);
    const enhancePrompt = useStudioStore((state) => state.enhancePrompt);
    const setEnhancePrompt = useStudioStore((state) => state.setEnhancePrompt);

    // Face Model State (Restored)
    const subjectType = useFaceModelStore((s) => s.subjectType);
    const isAnalyzing = useFaceModelStore((s) => s.isAnalyzing);
    const setSubjectType = useFaceModelStore.getState().setSubjectType;
    const startAnalysis = useFaceModelStore((state) => state.startAnalysis);

    const [viewportPreview, setViewportPreview] = React.useState<string | null>(null);

    // Dynamic Viewport Preview (Update every few seconds or on certain triggers)
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (getScreenshot) {
                setViewportPreview(getScreenshot());
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [getScreenshot]);

    // --- Paste Handler ---
    React.useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) files.push(file);
                }
            }

            if (files.length > 0) {
                // We need to import removeBackground utility dynamically or here
                // Note: removeBackground is in @/utils/imageProcessing
                try {
                    const { removeBackground } = await import('@/utils/imageProcessing');

                    // Show some global loading state if desired, or just assume async add
                    for (const file of files) {
                        // 1. Remove Background / Process
                        // Mimic logic from ImageUploader: race between AI and 5s timeout
                        const processPromise = removeBackground(file);
                        const timeoutPromise = new Promise<string>((resolve) =>
                            setTimeout(() => resolve(URL.createObjectURL(file)), 5000)
                        );
                        const processedUrl = await Promise.race([processPromise, timeoutPromise]);

                        // 2. Blob -> Base64
                        const response = await fetch(processedUrl);
                        const blob = await response.blob();
                        const base64Url = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });

                        // 3. Add to Store
                        useStudioStore.getState().addUploadedImage(base64Url);
                    }
                } catch (err) {
                    console.error('Paste upload failed:', err);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const getCost = () => {
        const size = String(imageSize).toUpperCase();
        if (size.includes('4K')) return 5;
        if (size.includes('2K')) return 2;
        return 1;
    };

    return (
        <div className="inspector">
            <h3>Inspector</h3>

            {/* Input Assets Section */}
            <div className="group">
                <label>Input Assets (Prioritized)</label>
                <div className="assets-grid">
                    {/* 1. Viewport Capture (Always 1st) */}
                    <div className="asset-card priority" title="Primary: 3D Viewport">
                        <div className="thumbnail-wrapper">
                            {viewportPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={viewportPreview} alt="Viewport" />
                            ) : (
                                <div className="thumbnail-placeholder">3D</div>
                            )}
                            <div className="badge">1st (Pose)</div>
                        </div>
                    </div>

                    {/* 2. Uploaded Images */}
                    {uploadedImages.map((url, idx) => (
                        <div key={idx} className="asset-card" title={`Reference ${idx + 2}`}>
                            <div className="thumbnail-wrapper">
                                {/* TODO: switch to next/image when stable */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Input ${idx}`} />
                                <div className="badge">{idx + 2}nd</div>
                                <button
                                    className="remove-overlay"
                                    onClick={() => removeUploadedImage(idx)}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="separator" />

            {/* Assets / Upload */}
            <div className="group">
                <label>Add References</label>

                {/* Asset Group Import */}
                <div style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
                    <button
                        className="toggle-action"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => {
                            const store = useAssetStore.getState();
                            store.fetchGroups(); // Ensure fresh
                            const groups = store.groups;

                            // Simple Prompt for MVP (ideal: proper Modal)
                            // In a real app we would use a Popover.
                            // Here we just toggle the drawer? No, that's management.
                            // Let's use a standard select if possible or just open Drawer for now?
                            // "Import from Group" -> Let's show a select if groups exist.
                            store.toggleDrawer(true);
                        }}
                    >
                        <FolderDown size={14} /> Open Asset Manager
                    </button>
                </div>
                {/* Quick Import Dropdown */}
                <div style={{ marginBottom: 8 }}>
                    <select
                        className="config-select"
                        style={{ width: '100%' }}
                        onChange={(e) => {
                            const groupId = e.target.value;
                            if (!groupId) return;
                            const group = useAssetStore.getState().groups.find(g => g.id === groupId);
                            if (group && confirm(`Import ${typeof group.assets === 'object' ? (group.assets as any[]).length : 0} assets from "${group.name}"?`)) {
                                (group.assets as any[]).forEach(asset => {
                                    useStudioStore.getState().addUploadedImage(asset.src);
                                });
                                e.target.value = ""; // Reset
                            }
                        }}
                    >
                        <option value="">📂 Quick Import from Group...</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({(g.assets as any[]).length})</option>
                        ))}
                    </select>
                </div>

                <ImageUploader />
            </div>

            <div className="separator" />

            {/* View Mode Toggle */}
            <div className="group">
                <label>View Mode</label>
                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${viewMode === 'textured' ? 'active' : ''}`}
                        onClick={() => setViewMode('textured')}
                        title="Show 2D texture on 3D model"
                        disabled={true}
                    >
                        <Layers size={14} /> 2D-3D Effect
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'clay' ? 'active' : ''}`}
                        onClick={() => setViewMode('clay')}
                        title="Show white clay model"
                    >
                        <Box size={14} /> White Model
                    </button>
                </div>
            </div>



            <div className="separator" />

            <div className="control-group">
                <label>Subject Type</label>
                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${subjectType === 'head' ? 'active' : ''}`}
                        onClick={() => setSubjectType('head')}
                    >
                        Head
                    </button>
                    <button
                        className={`toggle-btn ${subjectType === 'body' ? 'active' : ''}`}
                        onClick={() => setSubjectType('body')}
                        disabled={true}
                    >
                        Full Body
                    </button>
                </div>
            </div>

            <div className="action-area" style={{ marginTop: '12px', marginBottom: '20px' }}>
                <button
                    className="bake-btn"
                    onClick={() => startAnalysis()}
                    disabled={true}
                    style={{
                        borderColor: 'var(--accent-blue)',
                        color: 'var(--accent-blue)',
                        background: 'rgba(59, 130, 246, 0.1)'
                    }}
                >
                    {isAnalyzing ? 'Analyzing Topology...' :
                        subjectType === 'body' ? 'Analyze Body Pose' : 'Analyze Face Mesh'}
                </button>
            </div>

            <div className="control-group">
                <label>Shot Preset</label>
                <select value={shotPreset} onChange={(e) => setShotPreset(e.target.value)}>
                    <option value="closeup">Close-up (特写)</option>
                    <option value="fullbody">Full Body (全身)</option>
                    <option value="cowboy">Cowboy Shot (七分身)</option>
                </select>
            </div>

            <div className="control-group">
                <label>Lens (Focal Length)</label>
                <select
                    value={focalLength}
                    onChange={(e) => setFocalLength(Number(e.target.value))}
                >
                    <option value={24}>24mm (Wide)</option>
                    <option value={35}>35mm (Standard Wide)</option>
                    <option value={50}>50mm (Human Eye)</option>
                    <option value={85}>85mm (Portrait)</option>
                    <option value={200}>200mm (Telephoto)</option>
                </select>
            </div>

            <div className="control-group">
                <label>Lighting</label>
                <select
                    value={lightingPreset}
                    onChange={(e) => setLightingPreset(e.target.value)}
                >
                    <option value="rembrandt">Rembrandt (伦勃朗光)</option>
                    <option value="butterfly">Butterfly (蝴蝶光)</option>
                    <option value="split">Split (分割光)</option>
                    <option value="softbox">Softbox (柔光箱)</option>
                    <option value="hard">Hard Light (硬光)</option>
                </select>
            </div>

            <div className="separator" />

            {/* Generation Config Section */}
            <div className="group">
                <label>Generation Config</label>

                <div className="control-subgroup">
                    <span className="sub-label">Aspect Ratio</span>
                    <div className="ratio-grid">
                        {['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '9:21', '3:2', '2:3'].map((r) => (
                            <button
                                key={r}
                                className={`ratio-btn ${aspectRatio === r ? 'active' : ''}`}
                                onClick={() => setAspectRatio(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="control-subgroup">
                    <span className="sub-label">Resolution</span>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="config-select">
                        <option value="1K">1K (Standard)</option>
                        <option value="2K">2K (High Res)</option>
                        <option value="4K">4K (Ultra Res)</option>
                    </select>
                </div>

                <div className="control-subgroup">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="sub-label">Guidance Scale</span>
                        <span className="value-tag">{guidanceScale}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={guidanceScale}
                        onChange={(e) => setGuidanceScale(Number(e.target.value))}
                        className="config-slider"
                    />
                </div>

                <div className="control-subgroup">
                    <span className="sub-label">Negative Prompt</span>
                    <textarea
                        className="config-textarea"
                        placeholder="Items to exclude (e.g. text, logo, blurry)"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                    />
                </div>

                <div className="control-subgroup">
                    <button
                        className={`toggle-action ${enhancePrompt ? 'active' : ''}`}
                        onClick={() => setEnhancePrompt(!enhancePrompt)}
                    >
                        {enhancePrompt ? '✨ Prompt Enhancement ON' : 'Prompt Enhancement OFF'}
                    </button>
                </div>
            </div>

            <div className="separator" />

            <label className="sub-label">Prompt & Presets</label>
            <PromptManager />
            <PromptPreview />

            <div className="action-area" style={{ marginTop: '24px' }}>
                <button
                    className="bake-btn"
                    onClick={() => generateImage()}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Processing...' : `Bake Angles (${getCost()} Credits)`}
                </button>
                <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Est. Cost: {getCost()} Credits (Based on {imageSize})
                </div>
                <GenerationProgressBar />
            </div>

            <style jsx>{`
        .inspector {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-family: var(--font-sans);
            box-sizing: border-box;
        }
        .inspector-content { padding: 16px; font-family: var(--font-sans); }
        .control-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        .control-subgroup { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
        .sub-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
        .value-tag { font-size: 10px; color: var(--accent-blue); font-weight: bold; }
        
        .ratio-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
        }
        .ratio-btn {
            background: var(--control-bg);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            font-size: 10px;
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .ratio-btn.active {
            background: var(--accent-blue);
            border-color: var(--accent-blue);
            color: white;
        }
        .config-select {
            background: var(--control-bg);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 6px;
            border-radius: 4px;
            font-size: 12px;
            outline: none;
        }
        .config-slider {
            width: 100%;
            height: 4px;
            border-radius: 2px;
            accent-color: var(--accent-blue);
            cursor: pointer;
        }
        .config-textarea {
            background: var(--control-bg);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            padding: 8px;
            border-radius: 4px;
            font-size: 11px;
            resize: none;
            height: 40px;
            outline: none;
        }
        .config-textarea:focus { border-color: var(--accent-blue); color: var(--text-primary); }
        .toggle-action {
            width: 100%;
            background: rgba(255,255,255,0.05);
            border: 1px dashed var(--border-color);
            color: var(--text-secondary);
            padding: 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .toggle-action.active {
            background: rgba(59, 130, 246, 0.1);
            border-color: var(--accent-blue);
            color: var(--accent-blue);
        }

        .group label { 
            font-size: 11px; 
            color: var(--text-secondary); 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            font-weight: 500;
        }

        .assets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 8px;
            margin-top: 4px;
        }
        .asset-card {
            aspect-ratio: 1;
            background: #000;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            position: relative;
            overflow: hidden;
        }
        .asset-card.priority {
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 1px var(--accent-blue);
        }
        .thumbnail-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .thumbnail-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .thumbnail-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: var(--text-muted);
        }
        .badge {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.7);
            color: #fff;
            font-size: 8px;
            padding: 2px;
            text-align: center;
        }
        .priority .badge {
            background: var(--accent-blue);
        }
        .remove-overlay {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 16px;
            height: 16px;
            background: rgba(255,0,0,0.8);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 12px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .asset-card:hover .remove-overlay {
            opacity: 1;
        }

        .control-group select {
          background: var(--control-bg);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px;
          border-radius: 4px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .control-group select:focus {
          border-color: var(--accent-blue);
        }
        
        /* Toggle Group Styles */
        .toggle-group { display: flex; gap: 4px; background: var(--control-bg); padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); }
        .toggle-btn { flex: 1; border: none; background: transparent; color: var(--text-secondary); padding: 6px; font-size: 11px; cursor: pointer; border-radius: 3px; }
        .toggle-btn.active { background: var(--control-hover); color: var(--text-primary); font-weight: 500; }

        .bake-btn {
            width: 100%;
            background: var(--bg-panel-header);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }
        .bake-btn:hover:not(:disabled) {
            background: var(--control-hover);
            border-color: var(--text-muted);
        }
        .bake-btn:active:not(:disabled) {
            transform: translateY(1px);
        }
        .bake-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .toggle-group {
            display: flex;
            background: var(--control-bg);
            border-radius: 6px;
            padding: 2px;
            gap: 2px;
        }
        .toggle-btn {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .toggle-btn:hover {
            color: var(--text-primary);
            background: rgba(255,255,255,0.05);
        }
        .toggle-btn.active {
            background: var(--accent-blue);
            color: white;
        }
        .toggle-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .thumbnail-container {
            position: relative;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            overflow: hidden;
            background: #000;
            width: 80px; /* Small thumbnail size */
            height: 80px;
        }
        .input-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.8;
        }
        .thumbnail-hint {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 9px;
            text-align: center;
            padding: 2px;
        }
      `}</style>
        </div >
    );
}
