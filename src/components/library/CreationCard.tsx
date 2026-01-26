'use client';

import { RefreshCw, Clock, Download, Copy, User as UserIcon, FolderPlus, Eye, EyeOff, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useAssetStore } from '@/store/useAssetStore'; // Store import
import { useRouter } from 'next/navigation';

interface CreationItem {
    id: string;
    prompt: string;
    outputImageUrl: string;
    createdAt: Date | string;
    imageSize?: string;
    visible?: boolean;
    deletedAt?: Date | string | null;
    user?: {
        name: string | null;
        email: string;
    } | null;
}

interface CreationCardProps {
    item: CreationItem;
    isAdmin?: boolean;
    onRemix: (id: string) => void;
    onClick?: () => void;
}

export default function CreationCard({ item, isAdmin, onRemix, onClick }: CreationCardProps) {
    const router = useRouter();

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
    };

    const toggleVisibility = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(item.visible === false ? 'Show this creation?' : 'Hide this creation from user?')) return;

        try {
            await fetch('/api/admin/creation/toggle-visibility', {
                method: 'POST',
                body: JSON.stringify({ creationId: item.id, visible: !item.visible })
            });
            router.refresh();
        } catch (err) {
            alert('Failed to update');
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this?')) return;

        try {
            await fetch('/api/admin/creation/delete', {
                method: 'POST',
                body: JSON.stringify({ creationId: item.id })
            });
            router.refresh();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const isHidden = item.visible === false; // Default true if undefined
    const isDeleted = !!item.deletedAt;

    return (
        <div className={`creation-card group ${isHidden ? 'opacity-50' : ''}`} onClick={onClick}>
            <div className="image-wrapper">
                <Image
                    src={item.outputImageUrl}
                    alt={item.prompt}
                    width={800} // Placeholder width
                    height={800} // Placeholder height
                    style={{ width: '100%', height: 'auto', filter: isHidden ? 'grayscale(100%)' : 'none' }}
                    className="creation-image"
                    unoptimized={true}
                />

                <div className="overlay">
                    <div className="action-buttons">
                        {isAdmin && (
                            <>
                                <button className={`action-btn icon-btn ${isHidden ? 'bg-red-500' : ''}`} onClick={toggleVisibility} title={isHidden ? "Unhide" : "Hide"}>
                                    {isHidden ? <EyeOff size={14} color={isHidden ? "red" : "white"} /> : <Eye size={14} />}
                                </button>
                                <button className="action-btn icon-btn delete-btn" onClick={handleDelete} title="Delete">
                                    <Trash2 size={14} />
                                </button>
                                <div className="divider" style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>
                            </>
                        )}
                        <button
                            className="action-btn remix-btn"
                            onClick={(e) => { e.stopPropagation(); onRemix(item.id); }}
                            title="Remix this creation"
                        >
                            <RefreshCw size={14} />
                            {/* <span>Remix</span> - Hide text on card to save space if admin controls are there? No keep it for now */}
                        </button>
                        <button
                            className="action-btn icon-btn"
                            onClick={handleCopyPrompt}
                            title="Copy Prompt"
                        >
                            <Copy size={14} />
                        </button>
                        {/* Removed Add to Group button to save space or keep it? Keeping it. */}
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
                        {isHidden && <span className="badge" style={{ background: '#ef4444' }}>HIDDEN</span>}
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
                .delete-btn:hover {
                    background: #ef4444;
                    color: white;
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
