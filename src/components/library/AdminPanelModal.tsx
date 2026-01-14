'use client';

import { X, Check, Trash2, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAllUsers, approveUser, rejectUser, updateUserCredits } from '@/actions/admin';

export default function AdminPanelModal({ onClose }: { onClose: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editCreditsId, setEditCreditsId] = useState<string | null>(null);
    const [tempCredits, setTempCredits] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    const loadUsers = async () => {
        setLoading(true);
        const list = await getAllUsers();
        setUsers(list);
        setFilteredUsers(list);
        setLoading(false);
    };

    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers(users);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(u => u.email.toLowerCase().includes(lower)));
        }
    }, [searchTerm, users]);

    useEffect(() => {
        loadUsers();
    }, []);

    const handleApprove = async (id: string) => {
        await approveUser(id);
        loadUsers();
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        await rejectUser(id);
        loadUsers();
    };

    const startEditCredits = (user: any) => {
        setEditCreditsId(user.id);
        setTempCredits(user.credits || 0);
    };

    const saveCredits = async (id: string) => {
        await updateUserCredits(id, tempCredits);
        setEditCreditsId(null);
        loadUsers();
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="admin-overlay">
            <div className="window retro-window">
                <div className="window-title-bar">
                    <div className="title">System Administrator</div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={14} />
                    </button>
                </div>
                <div className="window-content">
                    <div className="content-inner">
                        <div className="content-inner">
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
                .search-input {
                    padding: 4px 8px;
                    border: 2px solid #fff;
                    border-right-color: #404040;
                    border-bottom-color: #404040;
                    background: #fff;
                    font-family: inherit;
                    width: 200px;
                }
            `}</style>
            </div>,
            document.body
            );
}
