'use client';

import { useState } from 'react';
import { MagicInput } from '@/components/persona/MagicInput';
import { PersonaEditor } from '@/components/persona/PersonaEditor';
import { PersonaResult } from '@/components/persona/PersonaResult';
import { DigitalPersona } from '@/interface/types/persona_types';
import { compilePrompt } from '@/lib/promptCompiler';

import SideMenu from '@/components/layout/Sidebar';

export default function PersonaPage() {
  const [persona, setPersona] = useState<DigitalPersona | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  const handleMagicInput = async (text: string, image?: string) => {
    if (image) {
      // Image Upload Mode
      setUploadedImage(image);
      setPersona(null); // Clear generated persona as we are using custom image
      return;
    }

    // Text Mode
    setIsInterpreting(true);
    setUploadedImage(null); // Clear uploaded image
    try {
      const res = await fetch('/api/py/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: text }),
      });
      if (!res.ok) throw new Error('Interpretation failed');
      const data = await res.json();
      setPersona(data);
    } catch (e) {
      console.error(e);
      alert('Failed to interpret intent. Please try again.');
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <div className="persona-layout">
      {/* Global Sidebar */}
      <SideMenu />

      {/* Main Content Area */}
      <main className="persona-content">
        <header className="header">
          <h1>数字人 <span className="subtitle">制造工厂</span></h1>
        </header>

        <div className="workspace">
          {/* Persona Editor Panel */}
          <div className="sidebar-editor">
            <div className="magic-section">
              <h2 className="section-title">01. 智能输入 (Magic Input)</h2>
              <MagicInput onSubmit={handleMagicInput} isLoading={isInterpreting} />
            </div>

            <div className="dna-section">
              <h2 className="section-title">02. 数字人 DNA</h2>
              <div className="editor-scroll">
                {persona ? (
                  <PersonaEditor persona={persona} setPersona={setPersona} />
                ) : (
                  <div className="empty-state">
                    {uploadedImage ? '使用参考图模式 (DNA 编辑不可用)' : '等待智能输入...'}
                  </div>
                )}
              </div>
            </div>

            <div className="prompt-preview-section">
              <h2 className="section-title">03. 最终 Prompt 预览</h2>
              <div className="preview-box">
                {persona ? (
                  <p>{compilePrompt(persona)}</p>
                ) : (
                  <span className="placeholder">
                    {uploadedImage ? '参考图已就绪 (使用 Image-to-Image 模式)' : '等待生成...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Result Viewport */}
          <div className="main-viewport">
            <div className="bg-gradient" />
            <PersonaResult persona={persona} uploadedImage={uploadedImage} />
          </div>
        </div>
      </main>

      <style jsx>{`
        .persona-layout {
            display: grid;
            grid-template-columns: 50px 1fr;
            grid-template-areas: "sidebar content";
            height: 100vh;
            background: var(--bg-app);
            overflow: hidden;
        }

        .persona-content {
            grid-area: content;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--bg-app);
        }

        .header {
            height: 64px;
            border-bottom: 1px solid var(--border-color);
            padding: 0 24px;
            display: flex;
            align-items: center;
            background: var(--bg-panel);
            flex-shrink: 0;
        }
        h1 {
            font-size: 18px;
            font-weight: 500;
            letter-spacing: -0.02em;
            color: var(--text-primary);
        }
        .subtitle {
            opacity: 0.4;
            font-weight: 300;
        }

        .workspace {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        .sidebar-editor {
            width: 450px;
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            background: var(--bg-panel);
            flex-shrink: 0;
        }

        .magic-section {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
        }

        .dna-section {
            flex: 1; /* Give DNA section flexible height but allow shrinking */
            min-height: 0; /* Important for flex child with scroll */
            padding: 24px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-bottom: 1px solid var(--border-color);
        }

        .prompt-preview-section {
            height: 200px;
            padding: 24px;
            background: #111;
            display: flex;
            flex-direction: column;
        }

        .preview-box {
            flex: 1;
            background: #000;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 12px;
            font-family: monospace;
            font-size: 11px;
            color: #aaa;
            overflow-y: auto;
            white-space: pre-wrap;
            line-height: 1.4;
        }
        .preview-box .placeholder {
            color: #555;
            font-style: italic;
        }
        /* Scrollbar for preview */
        .preview-box::-webkit-scrollbar { width: 6px; }
        .preview-box::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

        .section-title {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
        }

        .editor-scroll {
            flex: 1;
            overflow-y: auto;
            padding-right: 8px;
        }
        /* Custom scrollbar for editor */
        .editor-scroll::-webkit-scrollbar { width: 6px; }
        .editor-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

        .empty-state {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            font-style: italic;
            font-size: 14px;
        }

        .main-viewport {
            flex: 1;
            background: #0a0a0a;
            position: relative;
            display: flex;
            align-items: flex-start; /* Changed from center to allow scrolling from top */
            justify-content: center;
            padding: 40px;
            overflow-y: auto; /* Enable scrolling */
        }

        .bg-gradient {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%);
            pointer-events: none;
        }
      `}</style>
    </div>
  );
}
