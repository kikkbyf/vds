'use client';

import { useState } from 'react';
import SideMenu from '@/components/layout/Sidebar';
import { FaceSwapEditor } from '@/components/faceswap/FaceSwapEditor';
import { FaceSwapResult } from '@/components/faceswap/FaceSwapResult';

export default function FaceSwapPage() {
    const [targetImage, setTargetImage] = useState<string | null>(null);
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [extraPrompt, setExtraPrompt] = useState<string>('');
    const [imageSize, setImageSize] = useState<string>('1K');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleFaceSwap = async () => {
        if (!targetImage || !faceImage) return;
        setIsGenerating(true);
        setResultImage(null);

        try {
            const res = await fetch('/api/py/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Image 1 is the TARGET IMAGE (Base Style & Composition). Image 2 is the FACE REFERENCE.\n\nACTION: Perform a high-quality ID swap / Face Swap. replace the face of the main character in Image 1 with the face features from Image 2.\n\nCRITICAL RULES:\n1. KEEP the exact art style, lighting, color palette, and background of Image 1.\n2. KEEP the pose, expression (unless specified otherwise), and body type of Image 1.\n3. BLEND the new face naturally into the existing lighting environment of Image 1.\n4. If the User provided extra instructions, apply them subtly without breaking the above rules.\n\nOutput ONLY the modified Image 1.\n\nUSER EXTRA INSTRUCTION: ${extraPrompt || "None"}`,
                    images: [targetImage, faceImage],
                    image_size: imageSize,
                    aspect_ratio: aspectRatio,
                    negative_prompt: "low quality, bad anatomy, worst quality, distortion, mutation"
                }),
            });

            if (!res.ok) throw new Error('Face swap failed');
            const data = await res.json();
            setResultImage(data.image_data);

        } catch (e: any) {
            console.error(e);
            alert(`Face swap failed: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

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
                            imageSize={imageSize} setImageSize={setImageSize}
                            aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
                            onGenerate={handleFaceSwap}
                            isGenerating={isGenerating}
                        />
                    </div>

                    {/* Right Panel: Result */}
                    <div className="result-panel">
                        <div className="bg-gradient" />
                        <FaceSwapResult
                            resultImage={resultImage}
                            isGenerating={isGenerating}
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
            overflow: hidden; flex-shrink: 0;
            display: flex; flex-direction: column;
            min-height: 0;
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
