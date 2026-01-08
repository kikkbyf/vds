'use client';

import dynamic from 'next/dynamic';
import { Sliders, Camera, Settings, Maximize2 } from 'lucide-react';
import Inspector from '@/components/layout/Inspector';
import RenderView from '@/components/studio/RenderView';

const Viewport3D = dynamic(() => import('@/components/studio/Viewport3D'), { ssr: false, loading: () => <div className="placeholder-text">Loading Engine...</div> });

export default function Home() {
  return (
    <main className="grid-container">
      {/* Top Toolbar */}
      <header className="toolbar">
        <div className="logo">VDS <span className="beta-badge">BETA</span></div>
        <div className="mode-switch">
          <button className="active">Turntable</button>
          <button>Shot Builder</button>
          <button>Render</button>
        </div>
        <div className="actions">
          <button className="icon-btn"><Settings size={18} /></button>
        </div>
      </header>

      {/* 3D Control Area (Left) */}
      <section className="panel studio-panel">
        <div className="panel-header">
          <div className="panel-title"><Maximize2 size={14} /> 3D Control</div>
          <div className="panel-tools">Angle: 0° 15'</div>
        </div>
        <div className="panel-content viewport-3d">
          <Viewport3D />
        </div>
        <div className="panel-footer">
          <div className="status-indicator passed">Multi-angle Stability: Passed</div>
        </div>
      </section>

      {/* Cinematic Render Area (Center) */}
      <section className="panel render-panel">
        <div className="panel-header">
          <div className="panel-title"><Camera size={14} /> Cinematic Render</div>
          <div className="panel-tools">Match: 99%</div>
        </div>
        <div className="panel-content viewport-render">
          <RenderView />
        </div>
      </section>

      {/* Inspector (Right) */}
      <aside className="panel inspector-panel">
        <div className="panel-header">
          <div className="panel-title"><Sliders size={14} /> Inspector</div>
        </div>
        <Inspector />
      </aside>

      <style jsx>{`
        .grid-container {
          display: grid;
          grid-template-areas:
            "header header header"
            "studio render inspector";
          grid-template-columns: 1fr 1.2fr 300px;
          grid-template-rows: 48px 1fr;
          height: 100vh;
          width: 100vw;
          gap: 1px;
          background: var(--border-color); /* Creates borders between panels */
        }

        .toolbar {
          grid-area: header;
          background: var(--bg-panel);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .logo { font-weight: 700; font-size: 14px; letter-spacing: 1px; }
        .beta-badge { font-size: 10px; background: var(--accent-blue); color: white; padding: 2px 4px; border-radius: 2px; margin-left: 8px; }

        .mode-switch {
          display: flex;
          background: var(--bg-app);
          border-radius: 6px;
          padding: 2px;
        }
        .mode-switch button {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          border-radius: 4px;
        }
        .mode-switch button.active {
          background: var(--bg-panel-header);
          color: var(--text-primary);
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .panel {
          background: var(--bg-panel);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .studio-panel { grid-area: studio; }
        .render-panel { grid-area: render; }
        .inspector-panel { grid-area: inspector; }

        .panel-header {
          height: 36px;
          background: var(--bg-panel-header);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          border-bottom: 1px solid var(--border-color);
          font-size: 12px;
          color: var(--text-secondary);
        }
        .panel-title { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .panel-content { flex: 1; position: relative; }

        .panel-footer {
          height: 32px;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 11px;
        }
        .status-indicator.passed { color: var(--accent-green); }

        .viewport-3d, .viewport-render {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .placeholder-text { color: var(--text-muted); font-size: 12px; }
        .icon-btn {
          background: transparent; border: none; color: var(--text-secondary); cursor: pointer;
        }
        .icon-btn:hover { color: var(--text-primary); }
      `}</style>
    </main>
  );
}
