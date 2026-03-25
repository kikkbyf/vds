'use client';

// Imports updated
import { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useRouter } from 'next/navigation';
import CreationCard from '@/components/library/CreationCard';
import CreationDetailsModal from '@/components/library/CreationDetailsModal';
import { Folder, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { FullCreation, LibraryUserSummary } from '@/types/library';

interface LibraryGridProps {
    creations: FullCreation[];
    userSummaries?: LibraryUserSummary[];
    isAdmin?: boolean;
}

export default function LibraryGrid({ creations, userSummaries = [], isAdmin = false }: LibraryGridProps) {
    const setParamsFromCreation = useStudioStore((state) => state.setParamsFromCreation);
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [loadedUserCreations, setLoadedUserCreations] = useState<Record<string, FullCreation[]>>({});
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const isLazyAdminMode = isAdmin && userSummaries.length > 0;

    // 1. Group Creations by User
    const userGroups: Record<string, FullCreation[]> = {};
    creations.forEach(c => {
        const uid = c.userId;
        if (!userGroups[uid]) userGroups[uid] = [];
        userGroups[uid].push(c);
    });

    const directoryEntries = isLazyAdminMode
        ? userSummaries
        : Object.entries(userGroups).map(([userId, items]) => ({
            userId,
            user: items[0]?.user ?? null,
            latestImageUrl: items[0]?.outputImageUrl ?? null,
            latestCreatedAt: items[0]?.createdAt ?? null,
            creationCount: items.length,
        }));

    const userIds = directoryEntries.map((entry) => entry.userId);
    // If Admin, forces directory view if there are ANY users (even just 1) so they can see who it is.
    // Or if there are multiple users naturally.
    const isMultiUser = userIds.length > 1 || (isAdmin && userIds.length > 0);

    // Determine current view mode
    const effectiveViewingUserId = isMultiUser ? viewingUserId : (userIds[0] || null);

    const currentCreations = isLazyAdminMode
        ? (effectiveViewingUserId ? loadedUserCreations[effectiveViewingUserId] ?? [] : [])
        : (effectiveViewingUserId ? userGroups[effectiveViewingUserId] ?? [] : creations);

    const handleRemix = (id: string) => {
        const creation = currentCreations.find(c => c.id === id);
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
            inputImageUrls: typeof creation.inputImageUrls === 'string'
                ? JSON.parse(creation.inputImageUrls || '[]')
                : creation.inputImageUrls
        });

        router.push('/');
    };

    const openUserLibrary = async (userId: string) => {
        setViewingUserId(userId);
        setLoadError(null);

        if (!isLazyAdminMode || loadedUserCreations[userId]) {
            return;
        }

        setLoadingUserId(userId);
        try {
            const response = await fetch(`/api/library/users/${userId}`);
            if (!response.ok) {
                throw new Error('加载用户素材失败');
            }

            const data = await response.json() as { creations?: FullCreation[] };
            setLoadedUserCreations((prev) => ({
                ...prev,
                [userId]: Array.isArray(data.creations) ? data.creations : [],
            }));
        } catch (error) {
            console.error(error);
            setLoadError('加载该用户素材失败，请重试。');
        } finally {
            setLoadingUserId((current) => current === userId ? null : current);
        }
    };

    // 2. Group by Session (for the active user view)
    const sessionMap: Record<string, FullCreation[]> = {};
    currentCreations.forEach(c => {
        // Fallback for items without sessionId -> use their own ID (one-by-one)
        const sid = c.sessionId || c.id;
        if (!sessionMap[sid]) sessionMap[sid] = [];
        sessionMap[sid].push(c);
    });
    const sessionGroups = Object.entries(sessionMap).sort(([, aItems], [, bItems]) => {
        const dateA = new Date(aItems[0].createdAt).getTime();
        const dateB = new Date(bItems[0].createdAt).getTime();
        return dateB - dateA;
    });

    // LEVEL 1: USER DIRECTORY
    if (isMultiUser && !viewingUserId) {
        return (
            <div className="directory-container">
                <h2 className="section-title">User Directory <span className="count">({userIds.length})</span></h2>
                <div className="folder-grid">
                    {directoryEntries.map((entry) => {
                        return (
                            <div
                                key={entry.userId}
                                className="folder-card"
                                onClick={() => {
                                    void openUserLibrary(entry.userId);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="folder-preview">
                                    {entry.latestImageUrl ? (
                                        <div className="preview-image">
                                            <Image
                                                src={entry.latestImageUrl}
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
                                        <span>{entry.creationCount}</span>
                                    </div>
                                </div>
                                <div className="folder-info">
                                    <h3 className="user-email" title={entry.user?.email}>{entry.user?.email || 'Unknown User'}</h3>
                                    <p className="user-id">ID: {entry.userId.substring(0, 8)}...</p>
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
    const displayedCreations = currentCreations;
    const currentUserInfo = directoryEntries.find((entry) => entry.userId === effectiveViewingUserId)?.user ?? displayedCreations?.[0]?.user;
    const selectedCreation = displayedCreations.find(c => c.id === selectedId);

    if (isLazyAdminMode && viewingUserId && loadingUserId === viewingUserId && displayedCreations.length === 0) {
        return (
            <div className="empty-state">
                <h2>正在加载该用户的素材...</h2>
                <p>请稍候，按需读取历史记录中。</p>
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

    if (isLazyAdminMode && viewingUserId && loadError && displayedCreations.length === 0) {
        return (
            <div className="empty-state">
                <h2>加载失败</h2>
                <p>{loadError}</p>
                <button
                    className="retry-btn"
                    onClick={() => {
                        void openUserLibrary(viewingUserId);
                    }}
                >
                    重试
                </button>
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
                    p { font-size: 14px; margin-bottom: 16px; }
                    .retry-btn {
                        border: 1px solid var(--border-color);
                        background: var(--bg-panel);
                        color: var(--text-primary);
                        border-radius: 8px;
                        padding: 8px 14px;
                        cursor: pointer;
                    }
                `}</style>
            </div>
        );
    }

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
                                        isAdmin={isAdmin}
                                        onRemix={handleRemix}
                                        // Pass explicit handler to ensure it works
                                        onClick={() => {
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

            {selectedCreation && (
                <CreationDetailsModal
                    creation={selectedCreation}
                    isAdmin={isAdmin}
                    // Pass all items from the same session
                    relatedCreations={displayedCreations.filter(c => c.sessionId === selectedCreation.sessionId)}
                    onClose={() => setSelectedId(null)}
                    onRemix={handleRemix}
                />
            )}

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
