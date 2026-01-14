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
            <div className="window retro-window">
                <div className="window-title-bar">
                    <div className="title">System Administrator {viewLogsId ? '- Transaction Logs' : ''}</div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={14} />
                    </button>
                </div>
                <div className="window-content">
                    <div className="content-inner">
                        {viewLogsId ? (
                            // LOG VIEW
                            <div className="log-view">
                                <button className="back-btn" onClick={() => setViewLogsId(null)}>
                                    <ArrowLeft size={16} /> Back to Users
                                </button>
                                {logsLoading ? <p>Loading logs...</p> : (
                                    <table className="retro-table">
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
                                                    <td style={{ color: log.amount >= 0 ? 'green' : 'red' }}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                                    </td>
                                                </tr>
                                            ))}
                                            {logs.length === 0 && <tr><td colSpan={3}>No transactions found.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            // USER LIST VIEW
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3>User Database</h3>
                                    <input
                                        type="text"
                                        placeholder="Search email..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : (
                                    <div className="table-container">
                                        <table className="retro-table">
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
                                                        <td>{u.role}</td>
                                                        <td>
                                                            {u.approved ?
                                                                <span className="badge success">Active</span> :
                                                                <span className="badge warning">Pending</span>
                                                            }
                                                        </td>
                                                        <td>
                                                            {editCreditsId === u.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={tempCredits}
                                                                        onChange={e => setTempCredits(Number(e.target.value))}
                                                                        className="credit-input"
                                                                    />
                                                                    <button onClick={() => saveCredits(u.id)} className="icon-btn save">
                                                                        <Check size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 cursor-pointer hover:text-blue-400" onClick={() => startEditCredits(u)}>
                                                                    <Coins size={14} className="text-yellow-500" />
                                                                    <span>{u.credits ?? 0}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="actions">
                                                            <button
                                                                className="retro-btn sm info"
                                                                onClick={() => loadLogs(u.id)}
                                                                title="View History"
                                                            >
                                                                <BookOpen size={14} />
                                                            </button>
                                                            {!u.approved && (
                                                                <button className="retro-btn sm approve" onClick={() => handleApprove(u.id)}>
                                                                    Approve
                                                                </button>
                                                            )}
                                                            <button className="retro-btn sm reject" onClick={() => handleReject(u.id)}>
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
            </div>

            <style jsx>{`
                .admin-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(2px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .window {
                    width: 800px;
                    max-width: 90vw;
                    background: #c0c0c0;
                    border: 2px solid white;
                    border-right-color: #404040;
                    border-bottom-color: #404040;
                    box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                }
                .window-title-bar {
                    background: #000080;
                    color: white;
                    padding: 4px 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                }
                .close-btn {
                    background: #c0c0c0;
                    border: 1px solid white;
                    border-right-color: #404040;
                    border-bottom-color: #404040;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .close-btn:active {
                    border: 1px solid #404040;
                    border-right-color: white;
                    border-bottom-color: white;
                }
                .window-content {
                    padding: 16px;
                    font-family: 'Courier New', monospace;
                }
                .content-inner {
                    background: white;
                    border: 2px solid #404040;
                    border-right-color: white;
                    border-bottom-color: white;
                    padding: 16px;
                    height: 500px;
                    overflow-y: auto;
                }
                h3 { margin: 0; }
                
                .retro-table tr:hover td {
                    background: #000080;
                    color: white;
                }
                
                .retro-table { width: 100%; border-collapse: collapse; }
                .retro-table th { text-align: left; border-bottom: 2px solid #000; padding: 8px; position: sticky; top: 0; background: white; }
                .retro-table td { padding: 8px; border-bottom: 1px solid #eee; }
                .pending-row { background: #fffbe6; }
                .pending-row:hover td { color: white; background: #b45309; }
                
                .badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid #000; }
                .badge.success { background: #86efac; color: black; }
                .badge.warning { background: #fde047; color: black; }
                
                .retro-btn {
                    border: 2px solid white;
                    border-right-color: #404040;
                    border-bottom-color: #404040;
                    background: #c0c0c0;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .retro-btn:active {
                    border: 2px solid #404040;
                    border-right-color: white;
                    border-bottom-color: white;
                }
                .actions { display: flex; gap: 8px; }
                .retro-btn.approve { background: #86efac; }
                .retro-btn.reject { background: #fca5a5; }
                .retro-btn.info { background: #93c5fd; }
                
                .credit-input {
                    width: 60px;
                    padding: 2px;
                    border: 1px solid #000;
                }
                .icon-btn.save {
                    background: none;
                    border: none;
                    color: green;
                    cursor: pointer;
                }
                .search-input {
                    padding: 4px 8px;
                    border: 2px solid #fff;
                    border-right-color: #404040;
                    border-bottom-color: #404040;
                    background: #fff;
                    font-family: inherit;
                    width: 200px;
                }
                
                .back-btn {
                    border: none;
                    background: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: bold;
                    margin-bottom: 12px;
                    text-decoration: underline;
                }
            `}</style>
        </div>,
        document.body
    );
}
