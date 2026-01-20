
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAssetStore } from '@/store/useAssetStore'; // Fixed path
import { X, FolderPlus, Trash2, Upload, Plus, MoreHorizontal } from 'lucide-react';

export default function AssetManagerDrawer() {
    const {
        isDrawerOpen, toggleDrawer,
        groups, activeGroupId, setActiveGroup,
        fetchGroups, createGroup, deleteGroup,
        uploadLocalAsset, removeAsset
    } = useAssetStore();

    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isDrawerOpen) {
            fetchGroups();
        }
    }, [isDrawerOpen, fetchGroups]);

    if (!isDrawerOpen) return null;

    const activeGroup = groups.find(g => g.id === activeGroupId);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        await createGroup(newGroupName);
        setNewGroupName('');
        setIsCreating(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && activeGroupId) {
            for (const file of Array.from(files)) {
                // Simple Base64 conversion
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        uploadLocalAsset(activeGroupId, reader.result);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    return (
        <div className="asset-drawer-overlay">
            <div className="asset-drawer">
                {/* Header */}
                <div className="drawer-header">
                    <h3>Asset Manager</h3>
                    <button onClick={() => toggleDrawer(false)} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="drawer-body">
                    {/* Sidebar: Group List */}
                    <div className="group-list">
                        <div className="section-title">
                            <span>Groups</span>
                            <button onClick={() => setIsCreating(true)} className="icon-btn">
                                <Plus size={16} />
                            </button>
                        </div>

                        {isCreating && (
                            <div className="new-group-input">
                                <input
                                    autoFocus
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                                    onBlur={() => setIsCreating(false)}
                                    placeholder="Enter name..."
                                />
                            </div>
                        )}

                        <ul>
                            {groups.map(group => (
                                <li
                                    key={group.id}
                                    className={activeGroupId === group.id ? 'active' : ''}
                                    onClick={() => setActiveGroup(group.id)}
                                >
                                    <span className="group-name">{group.name}</span>
                                    <span className="count">({(group.assets as any[]).length})</span>
                                    {activeGroupId === group.id && (
                                        <button
                                            className="delete-group-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete group?')) deleteGroup(group.id);
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Main Content: Asset Grid */}
                    <div className="asset-grid-container">
                        {activeGroup ? (
                            <>
                                <div className="grid-header">
                                    <h4>{activeGroup.name}</h4>
                                    <button
                                        className="upload-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={14} /> Upload Ref
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        hidden
                                        multiple
                                        accept="image/*"
                                    />
                                </div>

                                <div className="assets-grid">
                                    {(activeGroup.assets as any[]).map((asset: any) => (
                                        <div key={asset.id} className="asset-item">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={asset.src} alt="asset" loading="lazy" />
                                            <button
                                                className="remove-asset-btn"
                                                onClick={() => removeAsset(activeGroup.id, asset.id)}
                                            >
                                                <X size={12} />
                                            </button>
                                            <div className="source-badge">
                                                {asset.source === 'system_gen' ? 'SYS' : 'UP'}
                                            </div>
                                        </div>
                                    ))}
                                    {(activeGroup.assets as any[]).length === 0 && (
                                        <div className="empty-state">
                                            No assets yet. Upload or add from Library.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="no-selection">
                                Select a group to manage assets
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .asset-drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    pointer-events: none; /* Let clicks pass through outside */
                }
                .asset-drawer {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 600px;
                    background: var(--bg-panel);
                    border-left: 1px solid var(--border-color);
                    box-shadow: -4px 0 20px rgba(0,0,0,0.5);
                    pointer-events: auto;
                    display: flex;
                    flex-direction: column;
                    z-index: 1001;
                }
                .drawer-header {
                    padding: 16px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .close-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                .drawer-body {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }
                .group-list {
                    width: 200px;
                    border-right: 1px solid var(--border-color);
                    background: var(--bg-panel-header);
                    display: flex;
                    flex-direction: column;
                }
                .section-title {
                    padding: 12px;
                    font-size: 12px;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .icon-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                .icon-btn:hover { color: var(--text-primary); }
                
                .new-group-input { padding: 8px; }
                .new-group-input input {
                    width: 100%;
                    background: var(--control-bg);
                    border: 1px solid var(--accent-blue);
                    color: var(--text-primary);
                    padding: 4px 8px;
                    font-size: 13px;
                    border-radius: 4px;
                    outline: none;
                }

                .group-list ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    overflow-y: auto;
                }
                .group-list li {
                    padding: 10px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 13px;
                    color: var(--text-secondary);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .group-list li:hover { background: rgba(255,255,255,0.05); }
                .group-list li.active {
                    background: var(--accent-blue);
                    color: white;
                }
                .group-name { 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                    max-width: 120px;
                }
                .count { font-size: 10px; opacity: 0.7; }
                .delete-group-btn {
                    background: transparent;
                    border: none;
                    color: white;
                    opacity: 0.7;
                    cursor: pointer;
                }

                .asset-grid-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-workspace);
                }
                .grid-header {
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border-color);
                }
                .upload-btn {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    background: var(--control-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                }
                .upload-btn:hover { border-color: var(--accent-blue); }

                .assets-grid {
                    padding: 16px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 12px;
                    overflow-y: auto;
                }
                .asset-item {
                    aspect-ratio: 1;
                    position: relative;
                    border-radius: 6px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .asset-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .remove-asset-btn {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .asset-item:hover .remove-asset-btn { opacity: 1; }
                .source-badge {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.6);
                    color: rgba(255,255,255,0.8);
                    font-size: 9px;
                    text-align: center;
                    padding: 2px;
                }
                .empty-state, .no-selection {
                    padding: 40px;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}
