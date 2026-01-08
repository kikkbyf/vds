'use client';

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';
import { removeBackground } from '@/utils/imageProcessing';

export default function ImageUploader() {
  const setImageUrl = useStudioStore((state) => state.setImageUrl);
  const setDepthMapUrl = useStudioStore((state) => state.setDepthMapUrl);
  const setIsExtractingDepth = useStudioStore((state) => state.setIsExtractingDepth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]); // New Debug State
  const workerRef = useRef<Worker | null>(null);

  const addLog = (msg: string) => setDebugLog(prev => [...prev.slice(-4), msg]); // Keep last 5 logs

  React.useEffect(() => {
    try {
      workerRef.current = new Worker('/depth-worker.js', { type: 'module' });

      workerRef.current.onmessage = (event) => {
        const { status, depthUrl, error } = event.data;
        if (status === 'complete') {
          addLog('✅ Depth Map Ready');
          setDepthMapUrl(depthUrl);
          setIsExtractingDepth(false);
        } else if (status === 'error') {
          addLog('❌ Worker Error: ' + error);
          console.error("❌ Depth Worker Failed:", error);
          setIsExtractingDepth(false);
        }
      };
      workerRef.current.onerror = (err) => {
        addLog('❌ Worker Startup Error: ' + err.message);
        setIsExtractingDepth(false);
      };
      addLog('✅ Worker Initialized');
    } catch (e) {
      addLog('❌ Init Failed: ' + (e as Error).message);
    }

    return () => workerRef.current?.terminate();
  }, [setDepthMapUrl, setIsExtractingDepth]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        // Create a race: AI extraction vs 5s timeout
        const processPromise = removeBackground(file);
        const timeoutPromise = new Promise<string>((resolve) =>
          setTimeout(() => resolve(URL.createObjectURL(file)), 5000)
        );

        const processedUrl = await Promise.race([processPromise, timeoutPromise]);
        setImageUrl(processedUrl);

        // Trigger Depth Estimation
        setIsExtractingDepth(true);
        addLog('🚀 Sending Image to Worker...');
        if (workerRef.current) {
          workerRef.current.postMessage({ imageUrl: processedUrl });
        }

      } catch (error) {
        addLog('❌ Main Extraction Failed');
        console.error("Extraction failed", error);
        setImageUrl(URL.createObjectURL(file));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="uploader-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <button
        className="upload-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
        <span>{isProcessing ? 'Extracting Subject...' : 'Upload Subject'}</span>
      </button>

      <div className="hint-text">
        <ImageIcon size={10} /> Supports PNG, JPG (Max 5MB)
      </div>

      {/* On-screen Debug Log */}
      <div style={{
        marginTop: 8, padding: 6, background: '#000', borderRadius: 4,
        fontSize: 10, fontFamily: 'monospace', color: '#0f0',
        maxHeight: 60, overflowY: 'auto', border: '1px solid #333'
      }}>
        {debugLog.length === 0 ? '> Ready' : debugLog.map((l, i) => <div key={i}>{'> ' + l}</div>)}
      </div>

      <style jsx>{`
        .uploader-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--control-bg);
          border: 1px dashed var(--border-color);
          color: var(--text-secondary);
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
          width: 100%;
        }
        .upload-btn:hover:not(:disabled) {
          border-color: var(--accent-blue);
          color: var(--text-primary);
          background: var(--control-hover);
        }
        .upload-btn:disabled {
            opacity: 0.6;
            cursor: wait;
        }
        .hint-text {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          font-size: 10px;
          padding-left: 2px;
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
