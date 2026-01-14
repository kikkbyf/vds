'use client';

import React from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { Loader2, Download } from 'lucide-react';

export default function RenderView() {
  const { generatedImage, isGenerating } = useStudioStore();

  return (
    <div className="render-container">
      {isGenerating ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} color="var(--accent-blue)" />
          <p>Synthesizing...</p>
        </div>
      ) : generatedImage ? (
        <div className="result-view">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={generatedImage} alt="Rendered Result" />
          <div className="overlay-actions">
            <button className="action-btn download"><Download size={16} /></button>
          </div>
        </div>
      ) : (
        <div className="placeholder-text">Waiting for input...</div>
      )}

      <style jsx>{`
        .render-container {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 12px;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .result-view {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .result-view img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .placeholder-text {
            color: var(--text-muted);
            font-size: 12px;
        }
      `}</style>
    </div>
  );
}
