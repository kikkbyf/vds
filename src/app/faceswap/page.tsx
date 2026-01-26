'use client';

import { useState } from 'react';
import SideMenu from '@/components/layout/Sidebar';
import { FaceSwapEditor } from '@/components/faceswap/FaceSwapEditor';
import { FaceSwapResult } from '@/components/faceswap/FaceSwapResult';

export default function FaceSwapPage() {
    const [targetImage, setTargetImage] = useState<string | null>(null);
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [extraPrompt, setExtraPrompt] = useState<string>('');

    return (
        <div className="faceswap-layout">
            <SideMenu />

            <main className="content-area">
                <header className="header">
                    <h1>AI 换脸 <span className="subtitle">FACE SWAP</span></h1>
                </header>

                <div className="workspace">
                    {/* Left Panel: Editor */}
                    <div className="editor-panel">
                        <FaceSwapEditor
                            targetImage={targetImage} setTargetImage={setTargetImage}
                            faceImage={faceImage} setFaceImage={setFaceImage}
                            extraPrompt={extraPrompt} setExtraPrompt={setExtraPrompt}
                        />
                    </div>

                    {/* Right Panel: Result */}
                    <div className="result-panel">
                        <div className="bg-gradient" />
                        <FaceSwapResult
                            targetImage={targetImage}
                            faceImage={faceImage}
                            extraPrompt={extraPrompt}
                        />
                    </div>
                </div>
            </main>

            <style jsx>{`
        .faceswap-layout {
            display: grid;
            grid-template-columns: 50px 1fr;
            grid-template-areas: "sidebar content";
            height: 100vh;
            background: var(--bg-app);
            overflow: hidden;
        }
        .content-area {
            grid-area: content;
            display: flex; flex-direction: column; overflow: hidden;
            background: var(--bg-app);
        }
        .header {
            height: 64px; border-bottom: 1px solid var(--border-color);
            padding: 0 24px; display: flex; align-items: center;
            background: var(--bg-panel); flex-shrink: 0;
        }
        h1 { font-size: 18px; font-weight: 500; letter-spacing: -0.02em; color: var(--text-primary); }
        .subtitle { opacity: 0.4; font-weight: 300; font-size: 14px; margin-left: 8px; }

        .workspace { flex: 1; display: flex; overflow: hidden; }

        .editor-panel {
            width: 400px; border-right: 1px solid var(--border-color);
            padding: 24px; background: var(--bg-panel);
            overflow-y: auto; flex-shrink: 0;
        }
        .result-panel {
            flex: 1; background: #0a0a0a; position: relative;
            padding: 40px; overflow-y: auto;
            display: flex; justify-content: center; align-items: flex-start;
        }
        .bg-gradient {
            position: absolute; inset: 0; pointer-events: none;
            background: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
        }
            `}</style>
        </div>
    );
}
