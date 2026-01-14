'use client';

import { X, Copy, Download, RefreshCw, Calendar, Image as ImageIcon, Sliders } from 'lucide-react';
import Image from 'next/image';
import { FullCreation } from '@/app/library/LibraryGrid';

interface CreationDetailsModalProps {
    creation: FullCreation;
    onClose: () => void;
    onRemix: (id: string) => void;
}

export default function CreationDetailsModal({ creation, onClose, onRemix }: CreationDetailsModalProps) {
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(creation.prompt);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = creation.outputImageUrl;
        link.download = `VDS-${creation.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-grid">
                    {/* Left: Image */}
                    <div className="image-section">
                        <div className="image-container">
                            <Image
                                src={creation.outputImageUrl}
                                alt="Creation"
                                width={1024}
                                height={1024}
                                className="main-image"
                                unoptimized={true}
                            />
                        </div>
                        <div className="action-bar">
                            <button className="primary-btn" onClick={() => onRemix(creation.id)}>
                                <RefreshCw size={16} /> Remix
                            </button>
                            <button className="secondary-btn" onClick={handleDownload}>
                                <Download size={16} /> Download
                            </button>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="details-section">
                        <header>
                            <h2>Creation Details</h2>
                            <div className="meta-row">
                                <span className="meta-tag">
                                    <Calendar size={12} /> {new Date(creation.createdAt).toLocaleString()}
                                </span>
                                <span className="meta-tag">
                                    <ImageIcon size={12} /> {creation.imageSize} ({creation.aspectRatio})
                                </span>
                            </div>
                        </header>

                        <div className="detail-group">
                            <label>Prompt</label>
                            <div className="prompt-box">
                                <p>{creation.prompt}</p>
                                <button className="copy-btn" onClick={handleCopyPrompt} title="Copy Prompt">
                                    <Copy size={14} />
                                </button>
                            </div>
                            {creation.negative && (
                                <div className="negative-box">
                                    <span className="label">Negative:</span> {creation.negative}
                                </div>
                            )}
                        </div>

                        {creation.inputImageUrls && creation.inputImageUrls.length > 0 && (
                            <div className="detail-group">
                                <label>Input References</label>
                                <div className="inputs-grid">
                                    {creation.inputImageUrls.map((url, i) => (
                                        <div key={i} className="input-thumb">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`Ref ${i}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="detail-group">
                            <label>Settings</label>
                            <div className="params-grid">
                                <ParamItem label="Shot" value={creation.shotPreset} />
                                <ParamItem label="Lighting" value={creation.lightingPreset} />
                                <ParamItem label="Focal Length" value={creation.focalLength ? `${creation.focalLength}mm` : null} />
                                <ParamItem label="Guidance" value={creation.guidance} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    animation: fadeIn 0.2s ease-out;
                }

                .modal-content {
                    background: var(--bg-panel);
                    width: 100%;
                    max-width: 1100px;
                    max-height: 90vh;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(0,0,0,0.5);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s;
                }
                .close-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }

                .modal-grid {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    height: 100%;
                    overflow: hidden;
                }

                .image-section {
                    background: #000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    padding: 40px;
                }

                .image-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .main-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 4px;
                }

                .action-bar {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }

                .details-section {
                    padding: 32px;
                    background: var(--bg-panel);
                    border-left: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    overflow-y: auto;
                }

                header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    background: linear-gradient(to right, #fff, #aaa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .meta-row {
                    display: flex;
                    gap: 12px;
                }

                .meta-tag {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: var(--text-muted);
                    background: rgba(255,255,255,0.05);
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .detail-group label {
                    display: block;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .prompt-box {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 12px;
                    position: relative;
                }

                .prompt-box p {
                    font-size: 13px;
                    line-height: 1.6;
                    color: var(--text-primary);
                    margin: 0;
                    padding-right: 24px;
                    white-space: pre-wrap;
                }

                .copy-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    opacity: 0.7;
                }
                .copy-btn:hover { color: white; opacity: 1; }

                .negative-box {
                    margin-top: 8px;
                    font-size: 12px;
                    color: var(--text-muted);
                    background: rgba(255,0,0,0.05);
                    padding: 8px;
                    border-radius: 6px;
                }
                .negative-box .label { color: #ff6b6b; font-weight: 500; margin-right: 4px; }

                .inputs-grid {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .input-thumb {
                    width: 60px;
                    height: 60px;
                    border-radius: 6px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    position: relative;
                }

                .input-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .params-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                
                .primary-btn, .secondary-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .primary-btn {
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                }
                .primary-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }

                .secondary-btn {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                .secondary-btn:hover { background: rgba(255,255,255,0.05); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                @media (max-width: 900px) {
                    .modal-grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
                    .image-section { padding: 20px; }
                }
            `}</style>
        </div>
    );
}

function ParamItem({ label, value }: { label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="param-item">
            <span className="p-label">{label}</span>
            <span className="p-value">{value}</span>
            <style jsx>{`
                .param-item {
                    background: rgba(255,255,255,0.03);
                    padding: 8px 12px;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .p-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
                .p-value { font-size: 12px; color: var(--text-primary); font-weight: 500; }
            `}</style>
        </div>
    );
}
