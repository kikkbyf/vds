'use client';

import React, { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '@/actions/admin';
import { X, Check, Trash2 } from 'lucide-react';

export default function AdminPanelModal({ onClose }: { onClose: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-xl border border-white/10 overflow-hidden shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Pending Approvals</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-center text-white/40">Loading request...</p>
                    ) : users.length === 0 ? (
                        <p className="text-center text-white/40 py-8">No pending registrations.</p>
                    ) : (
                        users.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg border border-white/5">
                                <div>
                                    <p className="text-white text-sm font-medium">{user.email}</p>
                                    <p className="text-white/30 text-xs">{new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(user.id)}
                                        className="bg-red-600/20 text-red-400 hover:bg-red-600/30 p-2 rounded transition-colors"
                                        title="Reject (Delete)"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        className="bg-green-600/20 text-green-400 hover:bg-green-600/30 p-2 rounded transition-colors"
                                        title="Approve User"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
