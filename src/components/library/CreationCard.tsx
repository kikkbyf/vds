'use client';

import { RefreshCw, Clock, Download, Copy, User as UserIcon, FolderPlus } from 'lucide-react';
import Image from 'next/image';
import { useAssetStore } from '@/store/useAssetStore'; // Store import

interface CreationItem {
    id: string;
    prompt: string;
    outputImageUrl: string;
    createdAt: Date;
    imageSize?: string;
    user?: {
        name: string | null;
        email: string;
    } | null;
}

interface CreationCardProps {
    item: CreationItem;
    onRemix: (id: string) => void;
    onClick?: () => void;
}

export default function CreationCard({ item, onRemix, onClick }: CreationCardProps) {
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = item.outputImageUrl;
        link.download = `VDS-${item.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.prompt);
        // Optional: toast notification could be added here
    };

    return (
        <div className="creation-card group" onClick={onClick}>
            <div className="image-wrapper">
                <Image
                    src={item.outputImageUrl}
                    alt={item.prompt}
                    width={800} // Placeholder width
                    height={800} // Placeholder height
                    style={{ width: '100%', height: 'auto' }}
                    className="creation-image"
                    unoptimized={true} // Force straightforward loading for local files
                />

                <div className="overlay">
                    <div className="action-buttons">
                        <button
                            className="action-btn remix-btn"
                            onClick={(e) => { e.stopPropagation(); onRemix(item.id); }}
                            title="Remix this creation"
                        >
                            <RefreshCw size={14} />
                            <span>Remix</span>
                        </button>
                        <button
                            className="action-btn icon-btn"
                            onClick={handleCopyPrompt}
                            title="Copy Prompt"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className="action-btn icon-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                const { activeGroupId, addSystemAsset, toggleDrawer } = useAssetStore.getState();
                                if (activeGroupId) {
                                    addSystemAsset(activeGroupId, item.outputImageUrl, item.prompt);
                                    // Optional: Toast here
                                    alert('Added to group!'); // Temporary feedback
                                } else {
                                    toggleDrawer(true);
                                }
                            }}
                            title="Add to Active Asset Group"
                        >
                            <FolderPlus size={14} />
                        </button>
                        <button
                            className="action-btn icon-btn"
                            onClick={handleDownload}
                            title="Download Original"
                        >
                            <Download size={14} />
                        </button>
                    </div>

                    <div className="overlay-info">
                        {item.imageSize && <span className="badge">{item.imageSize}</span>}
                        {item.user && (
                            <div className="badge user-badge" title={item.user.email}>
                                <UserIcon size={10} style={{ marginRight: 4 }} />
                                {item.user.name || 'User'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="info">
                <p className="prompt-text">{item.prompt}</p>
                <div className="meta">
                    <Clock size={11} />
                    <span suppressHydrationWarning>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <style jsx>{`
                .creation-card {
                    background: var(--bg-panel);
                    border-radius: 12px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                    position: relative;
                    cursor: pointer;
                }
                .creation-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    z-index: 10;
                }

                .image-wrapper {
                    position: relative;
                    width: 100%;
                    background: #1a1a1a;
                    font-size: 0; 
                }
                .creation-image {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                .overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                    padding: 16px;
                }
                .group:hover .overlay {
                    opacity: 1;
                }

                .overlay-info {
                    position: absolute;
                    bottom: 12px;
                    left: 12px;
                    display: flex;
                    gap: 6px;
                }
                .badge {
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .action-buttons {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transform: translateY(10px);
                    transition: all 0.3s;
                }
                .group:hover .action-buttons {
                    transform: translateY(0);
                }

                .action-btn {
                    border: none;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    height: 36px;
                    border-radius: 18px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                }
                .action-btn:hover {
                    transform: scale(1.05);
                }

                .remix-btn {
                    background: white;
                    color: black;
                    padding: 0 20px;
                }
                .remix-btn:hover {
                    background: #f0f0f0;
                }

                .icon-btn {
                    background: rgba(0,0,0,0.6);
                    color: white;
                    width: 36px;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .icon-btn:hover {
                    background: white;
                    color: black;
                }
                
                .user-badge {
                    display: flex;
                    align-items: center;
                    background: rgba(59, 130, 246, 0.8); /* Blue tint for user */
                    border-color: rgba(59, 130, 246, 0.4);
                }

                .info {
                    padding: 12px 14px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .prompt-text {
                    font-size: 13px;
                    color: var(--text-primary);
                    margin: 0 0 10px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.5;
                    opacity: 0.9;
                }
                .meta {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: var(--text-muted);
                }
            `}</style>
        </div>
    );
}
