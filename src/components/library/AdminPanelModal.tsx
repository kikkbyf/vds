'use client';

import { X, Check, Trash2, Coins, BookOpen, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAllUsers, approveUser, rejectUser, updateUserCredits, getUserLogs } from '@/actions/admin';

export default function AdminPanelModal({ onClose }: { onClose: () => void }) {
    interface User {
        id: string;
        email: string;
        role: string;
        approved: boolean;
        credits: number;
        createdAt: Date | string;
    }

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editCreditsId, setEditCreditsId] = useState<string | null>(null);
    const [tempCredits, setTempCredits] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Log View State
    const [viewLogsId, setViewLogsId] = useState<string | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const list = await getAllUsers();
            // Ensure list is an array to prevnt 'map is not a function' if server returns null
            if (!Array.isArray(list)) throw new Error('Invalid response from server');

            setUsers(list);
            setFilteredUsers(list);
        } catch (err) {
            console.error(err);
            setError('Failed to load users. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async (userId: string) => {
        setLogsLoading(true);
        setViewLogsId(userId);
        const data = await getUserLogs(userId);
        setLogs(data);
        setLogsLoading(false);
    };

    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers(users);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(u => u.email.toLowerCase().includes(lower)));
        }
    }, [searchTerm, users]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadUsers();
    }, []);

    const handleApprove = async (id: string) => {
        const res = await approveUser(id);
        if (res.error) {
            alert(res.error);
        }
        loadUsers();
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const res = await rejectUser(id);
        if (res.error) {
            alert(res.error);
        }
        loadUsers();
    };

    const startEditCredits = (user: User) => {
        setEditCreditsId(user.id);
        setTempCredits(user.credits || 0);
    };

    const saveCredits = async (id: string) => {
        const res = await updateUserCredits(id, tempCredits);
        if (res.error) {
            alert(res.error);
        }
        setEditCreditsId(null);
        loadUsers();
    };

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <div className="admin-overlay">
            <div className="modern-window">
                <div className="window-header">
                    <h2 className="title">System Administrator {viewLogsId ? '- Transaction Logs' : ''}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="window-content">
                    {viewLogsId ? (
                        // LOG VIEW
                        <div className="log-view">
                            <button className="back-btn" onClick={() => setViewLogsId(null)}>
                                <ArrowLeft size={16} /> Back to Users
                            </button>
                            {logsLoading ? <div className="loading">Loading logs...</div> : (
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Action</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.createdAt).toLocaleString()}</td>
                                                <td>{log.reason}</td>
                                                <td style={{ color: log.amount >= 0 ? 'var(--accent-green)' : '#ef4444' }}>
                                                    {log.amount > 0 ? '+' : ''}{log.amount}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && <tr><td colSpan={3} className="empty-cell">No transactions found.</td></tr>}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        // USER LIST VIEW
                        <>
                            <div className="toolbar">
                                <div className="stats">
                                    <span className="label">Total Users:</span>
                                    <span className="value">{users.length}</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search email..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            {loading ? (
                                <div className="loading">Loading database...</div>
                            ) : (
                                <div className="table-container">
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Credits</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className={!u.approved ? 'pending-row' : ''}>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className={`role-badge ${u.role === 'ADMIN' ? 'admin' : ''}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {u.approved ?
                                                            <span className="status-dot active" title="Active"></span> :
                                                            <span className="status-dot pending" title="Pending Approval"></span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {editCreditsId === u.id ? (
                                                            <div className="credit-edit">
                                                                <input
                                                                    type="number"
                                                                    value={tempCredits}
                                                                    onChange={e => setTempCredits(Number(e.target.value))}
                                                                    className="mini-input"
                                                                    autoFocus
                                                                />
                                                                <button onClick={() => saveCredits(u.id)} className="icon-btn save">
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="credit-display" onClick={() => startEditCredits(u)}>
                                                                <Coins size={14} className="icon" />
                                                                <span>{u.credits ?? 0}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="actions">
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => loadLogs(u.id)}
                                                            title="View History"
                                                        >
                                                            <BookOpen size={14} />
                                                        </button>
                                                        {!u.approved && (
                                                            <button className="action-btn approve" onClick={() => handleApprove(u.id)} title="Approve">
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        <button className="action-btn delete" onClick={() => handleReject(u.id)} title="Delete User">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .admin-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                }
                .modern-window {
                    width: 900px;
                    max-width: 95vw;
                    height: 600px;
                    background: var(--bg-panel);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .window-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-panel-header);
                }
                .title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                }
                .close-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                }
                .window-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                
                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .stats {
                    display: flex;
                    gap: 8px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }
                .stats .value {
                    color: var(--text-primary);
                    font-weight: 600;
                }
                .search-input {
                    background: var(--control-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    width: 240px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .search-input:focus {
                    border-color: var(--accent-blue);
                }

                .table-container {
                    flex: 1;
                    overflow-y: auto;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                }
                .modern-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .modern-table th {
                    text-align: left;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-panel-header);
                    color: var(--text-secondary);
                    font-weight: 500;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .modern-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                .modern-table tr:last-child td {
                    border-bottom: none;
                }
                .modern-table tr:hover td {
                    background: var(--control-hover);
                }

                .pending-row td {
                    background: rgba(234, 179, 8, 0.1); 
                }
                .pending-row:hover td {
                    background: rgba(234, 179, 8, 0.15);
                }

                .role-badge {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--control-bg);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }
                .role-badge.admin {
                    background: rgba(59, 130, 246, 0.15);
                    color: var(--accent-blue);
                    border-color: rgba(59, 130, 246, 0.3);
                }

                .status-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .status-dot.active { background: var(--accent-green); box-shadow: 0 0 5px rgba(16, 185, 129, 0.4); }
                .status-dot.pending { background: #eab308; }

                .credit-display {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    color: #fbbf24;
                    font-weight: 500;
                    transition: opacity 0.2s;
                }
                .credit-display:hover { opacity: 0.8; }
                
                .credit-edit {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .mini-input {
                    background: var(--bg-app);
                    border: 1px solid var(--accent-blue);
                    color: var(--text-primary);
                    padding: 2px 6px;
                    border-radius: 4px;
                    width: 60px;
                    font-size: 13px;
                }
                .icon-btn {
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 4px;
                }
                .icon-btn.save { color: var(--accent-green); }
                .icon-btn.save:hover { background: rgba(16, 185, 129, 0.1); }

                .actions {
                    display: flex;
                    gap: 4px;
                }
                .action-btn {
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .action-btn:hover {
                    background: var(--control-bg);
                    color: var(--text-primary);
                }
                .action-btn.approve { color: var(--accent-green); }
                .action-btn.approve:hover { background: rgba(16, 185, 129, 0.1); }
                .action-btn.delete { color: #f87171; }
                .action-btn.delete:hover { background: rgba(248, 113, 113, 0.1); }

                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 14px;
                    margin-bottom: 20px;
                    padding: 0;
                }
                .back-btn:hover { color: var(--text-primary); }

                .loading, .empty-cell {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-muted);
                    font-style: italic;
                }
            `}</style>
        </div>,
        document.body
    );
}
