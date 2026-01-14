'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPendingUsers, approveUser, rejectUser } from '@/actions/admin';
import { X, Check, Trash2 } from 'lucide-react';

export default function AdminPanelModal({ onClose }: { onClose: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadUsers();
        return () => setMounted(false);
    }, []);

    const loadUsers = async () => {
        const list = await getPendingUsers();
        setUsers(list);
        setLoading(false);
    };

    const handleApprove = async (userId: string) => {
        if (!confirm('Approve this user?')) return;
        const res = await approveUser(userId);
        if (res.success) loadUsers();
    };

    const handleReject = async (userId: string) => {
        if (!confirm('Reject and delete this user request?')) return;
        const res = await rejectUser(userId);
        if (res.success) loadUsers();
    };

    if (!mounted) return null;

    return createPortal(
        <div className="modal-overlay">
            <div className="retro-window">
                <div className="window-header">
                    <div className="window-title">System Administrator</div>
                    <div className="window-controls">
                        <button onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="window-content">
                    <div className="panel-info">
                        <strong>Pending Access Requests</strong>
                        <span>{users.length} item(s)</span>
                    </div>

                    <div className="user-list-frame">
                        {loading ? (
                            <div className="status-msg">Scanning network...</div>
                        ) : users.length === 0 ? (
                            <div className="status-msg">No pending requests found.</div>
                        ) : (
                            <table className="retro-table">
                                <thead>
                                    <tr>
                                        <th>User Identity</th>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="user-email">{user.email}</td>
                                            <td className="user-date">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="action-cell">
                                                <button
                                                    onClick={() => handleReject(user.id)}
                                                    className="retro-btn danger small"
                                                    title="Reject"
                                                >
                                                    REJECT
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(user.id)}
                                                    className="retro-btn success small"
                                                    title="Approve"
                                                >
                                                    APPROVE
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    font-family: 'Tahoma', 'Segoe UI', sans-serif;
                }

                .retro-window {
                    width: 500px;
                    background: #c0c0c0;
                    border: 2px solid;
                    border-color: #dfdfdf #404040 #404040 #dfdfdf;
                    box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
                    padding: 2px;
                }

                .window-header {
                    background: #000080;
                    padding: 4px 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }

                .window-title {
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }

                .window-controls button {
                    width: 16px;
                    height: 14px;
                    background: #c0c0c0;
                    border: 1px solid;
                    border-color: #dfdfdf #404040 #404040 #dfdfdf;
                    font-size: 10px;
                    line-height: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .window-content {
                    padding: 12px;
                }

                .panel-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 12px;
                }

                .user-list-frame {
                    background: white;
                    border: 2px solid;
                    border-color: #404040 #dfdfdf #dfdfdf #404040;
                    overflow: auto;
                    height: 300px;
                    padding: 2px;
                }

                .status-msg {
                    padding: 20px;
                    text-align: center;
                    color: #808080;
                    font-style: italic;
                    font-size: 13px;
                }

                .retro-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }

                .retro-table th {
                    text-align: left;
                    padding: 4px 8px;
                    border-bottom: 1px solid #c0c0c0;
                    color: #808080;
                    font-weight: normal;
                }

                .retro-table td {
                    padding: 6px 8px;
                    color: #000;
                }

                .retro-table tr:hover {
                    background: #000080;
                    color: white;
                }

                .retro-table tr:hover td {
                    color: white;
                }

                /* Buttons inside table */
                .action-cell {
                    display: flex;
                    gap: 6px;
                    justify-content: flex-end;
                }

                .retro-btn {
                    background: #c0c0c0;
                    border: 2px solid;
                    border-color: #dfdfdf #404040 #404040 #dfdfdf;
                    padding: 2px 8px;
                    font-size: 10px;
                    color: #000;
                    cursor: pointer;
                    font-family: 'Tahoma', sans-serif;
                    text-transform: uppercase;
                }

                .retro-btn:active {
                    border-color: #404040 #dfdfdf #dfdfdf #404040;
                    transform: translate(1px, 1px);
                }

                /* Danger button style override */
                .retro-btn.danger {
                    color: #800000;
                }
                .retro-btn.success {
                    color: #008000;
                    font-weight: bold;
                }
            `}</style>
        </div>,
        document.body
    );
}
