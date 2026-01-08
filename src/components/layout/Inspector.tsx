'use client';

import React from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useFaceModelStore } from '@/store/useFaceModelStore';
import ImageUploader from './ImageUploader';
import { Layers, Box, Grid3X3 } from 'lucide-react';

export default function Inspector() {
    const focalLength = useStudioStore((state) => state.focalLength);
    const setFocalLength = useStudioStore((state) => state.setFocalLength);

    const shotPreset = useStudioStore((state) => state.shotPreset);
    const setShotPreset = useStudioStore((state) => state.setShotPreset);

    const lightingPreset = useStudioStore((state) => state.lightingPreset);
    const setLightingPreset = useStudioStore((state) => state.setLightingPreset);

    const viewMode = useStudioStore((state) => state.viewMode);
    const setViewMode = useStudioStore((state) => state.setViewMode);

    const generateImage = useStudioStore((state) => state.generateImage);
    const isGenerating = useStudioStore((state) => state.isGenerating);

    // Extract hooks to top level to avoid "Rendered fewer hooks" error
    const subjectType = useFaceModelStore((s) => s.subjectType);
    const isAnalyzing = useFaceModelStore((s) => s.isAnalyzing);
    const setSubjectType = useFaceModelStore.getState().setSubjectType; // Keep original for now as toggleSubjectType is new
    const startAnalysis = useFaceModelStore((state) => state.startAnalysis); // Changed to direct hook access

    return (
        <div className="inspector">
            <h3>Inspector</h3>

            {/* Assets / Upload */}
            <div className="group">
                <label>Subject</label>
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
                        title="Textured"
                    >
                        <Layers size={14} />
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'clay' ? 'active' : ''}`}
                        onClick={() => setViewMode('clay')}
                        title="Clay Render"
                    >
                        <Box size={14} />
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'wireframe' ? 'active' : ''}`}
                        onClick={() => setViewMode('wireframe')}
                        title="Wireframe"
                    >
                        <Grid3X3 size={14} />
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
                    >
                        Full Body
                    </button>
                </div>
            </div>

            <div className="action-area" style={{ marginTop: '12px', marginBottom: '20px' }}>
                <button
                    className="bake-btn"
                    onClick={() => startAnalysis()}
                    disabled={isAnalyzing}
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

            <div className="action-area" style={{ marginTop: '24px' }}>
                <button
                    className="bake-btn"
                    onClick={() => generateImage()}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Processing...' : 'Bake Angles'}
                </button>
            </div>

            <style jsx>{`
        .inspector-content { padding: 16px; font-family: var(--font-sans); }
        .control-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        .control-group label { 
            font-size: 11px; 
            color: var(--text-secondary); 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            font-weight: 500;
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
      `}</style>
        </div>
    );
}
