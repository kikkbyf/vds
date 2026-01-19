'use client';

// Imports updated
import { useState, useMemo } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useRouter } from 'next/navigation';
import CreationCard from '@/components/library/CreationCard';
import CreationDetailsModal from '@/components/library/CreationDetailsModal';
import { Folder, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

// Define the full creation type needed for remixing
export interface FullCreation {
    id: string;
    userId: string;
    prompt: string;
    negative: string | null;
    aspectRatio: string;
    imageSize: string;
    shotPreset: string | null;
    lightingPreset: string | null;
    focalLength: number | null;
    guidance: number | null;
    inputImageUrls: string[];
    outputImageUrl: string;
    status: string;
    createdAt: Date;
    sessionId?: string;
    creationType?: 'extraction' | 'digital_human' | 'standard';
    user?: {
        name: string | null;
        email: string;
    } | null;
}

interface LibraryGridProps {
    creations: FullCreation[];
}

export default function LibraryGrid({ creations }: LibraryGridProps) {
    const setParamsFromCreation = useStudioStore((state) => state.setParamsFromCreation);
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    // 1. Group Creations by User
    const userGroups = useMemo(() => {
        const groups: Record<string, FullCreation[]> = {};
        creations.forEach(c => {
            const uid = c.userId;
            if (!groups[uid]) groups[uid] = [];
            groups[uid].push(c);
        });
        return groups;
    }, [creations]);

    const userIds = Object.keys(userGroups);
    const isMultiUser = userIds.length > 1;

    // Determine current view mode
    const effectiveViewingUserId = isMultiUser ? viewingUserId : (userIds[0] || null);

    const handleRemix = (id: string) => {
        const creation = creations.find(c => c.id === id);
        if (!creation) return;

        setParamsFromCreation({
            prompt: creation.prompt,
            negative: creation.negative,
            aspectRatio: creation.aspectRatio,
            imageSize: creation.imageSize,
            shotPreset: creation.shotPreset,
            lightingPreset: creation.lightingPreset,
            focalLength: creation.focalLength,
            guidance: creation.guidance,
            inputImageUrls: creation.inputImageUrls
        });

        router.push('/');
    };

    // 2. Group by Session (for the active user view)
    const sessionGroups = useMemo(() => {
        const displayed = effectiveViewingUserId ? userGroups[effectiveViewingUserId] : [];
        if (!displayed) return [];

        const groups: Record<string, FullCreation[]> = {};
        displayed.forEach(c => {
            // Fallback for items without sessionId -> group by 'legacy'
            const sid = c.sessionId || 'legacy';
            if (!groups[sid]) groups[sid] = [];
            groups[sid].push(c);
        });

        // Sort sessions by date (newest first)
        return Object.entries(groups).sort(([, aItems], [, bItems]) => {
            const dateA = new Date(aItems[0].createdAt).getTime();
            const dateB = new Date(bItems[0].createdAt).getTime();
            return dateB - dateA;
        });
    }, [effectiveViewingUserId, userGroups]);

    // LEVEL 1: USER DIRECTORY
    if (isMultiUser && !viewingUserId) {
        return (
            <div className="directory-container">
                <h2 className="section-title">User Directory <span className="count">({userIds.length})</span></h2>
                <div className="folder-grid">
                    {userIds.map(uid => {
                        const userCreations = userGroups[uid];
                        const user = userCreations[0]?.user;
                        const latestImage = userCreations[0]?.outputImageUrl;

                        return (
                            <div key={uid} className="folder-card" onClick={() => setViewingUserId(uid)}>
                                <div className="folder-preview">
                                    {latestImage ? (
                                        <div className="preview-image">
                                            <Image
                                                src={latestImage}
                                                alt="Cover"
                                                width={300}
                                                height={300}
                                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="preview-placeholder">
                                            <Folder size={48} />
                                        </div>
                                    )}
                                    <div className="count-badge">
                                        <ImageIcon size={12} />
                                        <span>{userCreations.length}</span>
                                    </div>
                                </div>
                                <div className="folder-info">
                                    <h3 className="user-email" title={user?.email}>{user?.email || 'Unknown User'}</h3>
                                    <p className="user-id">ID: {uid.substring(0, 8)}...</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <style jsx>{`
                    .directory-container { padding: 32px; }
                    .section-title {
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 24px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .count { color: var(--text-secondary); font-size: 16px; font-weight: 400; }
                    
                    .folder-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 24px;
                    }
                    
                    .folder-card {
                        background: var(--bg-panel);
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        overflow: hidden;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .folder-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                        border-color: var(--accent-blue);
                    }

                    .folder-preview {
                        height: 160px;
                        background: #1a1a1a;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-muted);
                    }
                    .preview-image { width: 100%; height: 100%; }
                    
                    .count-badge {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.6);
                        color: white;
                        backdrop-filter: blur(4px);
                        border: 1px solid rgba(255,255,255,0.1);
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .folder-info { padding: 16px; }
                    .user-email {
                        font-size: 14px;
                        font-weight: 600;
                        margin: 0 0 4px 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .user-id {
                        font-size: 11px;
                        color: var(--text-muted);
                        font-family: monospace;
                        margin: 0;
                    }
                `}</style>
            </div>
        );
    }

    // Determine current user info for header
    const displayedCreations = effectiveViewingUserId ? userGroups[effectiveViewingUserId] : [];
    const currentUserInfo = displayedCreations?.[0]?.user;
    const selectedCreation = creations.find(c => c.id === selectedId);

    if (!displayedCreations || displayedCreations.length === 0) {
        return (
            <div className="empty-state">
                <h2>No creations yet</h2>
                <p>Start generating in the Studio to build your library.</p>
                <style jsx>{`
                    .empty-state {
                        height: 60vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-secondary);
                        text-align: center;
                    }
                    h2 { font-size: 18px; margin-bottom: 8px; color: var(--text-primary); }
                    p { font-size: 14px; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="gallery-layout">
            {/* Header for Admin drill-down navigation */}
            {isMultiUser && viewingUserId && (
                <div className="gallery-header">
                    <button className="back-btn" onClick={() => setViewingUserId(null)}>
                        <ArrowLeft size={16} />
                        Back to Users
                    </button>
                    <div className="user-context">
                        <span className="label">Viewing User:</span>
                        <span className="value">{currentUserInfo?.email || viewingUserId}</span>
                    </div>
                </div>
            )}

            <div className="sessions-list">
                {sessionGroups.map(([sessionId, items]) => {
                    // Identify primary item: first 'digital_human' or fallback to first item
                    const primaryItem = items.find(i => i.creationType === 'digital_human') || items[0];

                    return (
                        <div key={sessionId} className="session-block">
                            <div className="grid-item">
                                {/* Wrap in a clickable container to ensure click handling works regardless of child structure */}
                                <div
                                    className="card-click-wrapper"
                                    style={{ position: 'relative', zIndex: 1 }}
                                >
                                    <CreationCard
                                        item={primaryItem}
                                        onRemix={handleRemix}
                                        // Pass explicit handler to ensure it works
                                        onClick={() => {
                                            console.log('Opening details for:', primaryItem.id);
                                            setSelectedId(primaryItem.id);
                                        }}
                                    />
                                    {items.length > 1 && (
                                        <div className="stack-badge">
                                            <div className="stack-count">+{items.length - 1}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .gallery-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-app);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 6px;
                    transition: background 0.2s;
                }
                .back-btn:hover { background: var(--control-bg); }
                
                .user-context {
                    font-size: 13px;
                    display: flex;
                    gap: 8px;
                }
                .user-context .label { color: var(--text-secondary); }
                .user-context .value { font-weight: 600; color: var(--accent-blue); }

                /* GRID LAYOUT FOR SESSIONS */
                .sessions-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                    padding: 24px;
                }

                .session-block {
                    position: relative;
                }

                .grid-item {
                    position: relative;
                }

                .stack-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    border-radius: 12px;
                    padding: 4px 8px;
                    font-size: 11px;
                    font-weight: 600;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255,255,255,0.2);
                    pointer-events: none;
                    z-index: 5;
                }
                
                @media (max-width: 600px) {
                    .sessions-list { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
