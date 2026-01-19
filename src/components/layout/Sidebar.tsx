'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Image as ImageIcon, LogOut, Shield, Coins } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
// import { getPendingUsers } from '@/actions/admin';
import { useStudioStore } from '@/store/useStudioStore';
import dynamic from 'next/dynamic';

const AdminPanelModal = dynamic(() => import('@/components/library/AdminPanelModal'), { ssr: false });

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const [showAdmin, setShowAdmin] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Global Store
    const credits = useStudioStore(s => s.credits);
    const fetchCredits = useStudioStore(s => s.fetchCredits);

    const isAdmin = session?.user?.role === 'ADMIN';

    const isActive = (path: string) => pathname === path;

    const checkPending = async () => {
        try {
            const res = await fetch('/api/admin/pending');
            if (res.ok) {
                const data = await res.json();
                setPendingCount(data.count);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        // Fetch credits for everyone
        if (session?.user) {
            fetchCredits();
        }

        if (isAdmin) {
            // Initial fetch
            checkPending();

            // Poll every 30s
            const interval = setInterval(() => {
                checkPending();
                fetchCredits(); // Poll credits too
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [session, isAdmin]);

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.replace('/login');
    };

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-top">
                    <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} title="Studio">
                        <Home size={20} />
                    </Link>
                    <Link href="/library" className={`nav-item ${isActive('/library') ? 'active' : ''}`} title="My Library">
                        <ImageIcon size={20} />
                    </Link>
                    <Link href="/persona" className={`nav-item ${isActive('/persona') ? 'active' : ''}`} title="数字人制造">
                        <span className="text-xl">👤</span>
                    </Link>

                    {isAdmin && (
                        <button
                            className={`nav-item admin-btn ${showAdmin ? 'active' : ''}`}
                            onClick={() => setShowAdmin(true)}
                            title="Admin Approvals"
                        >
                            <div className="icon-wrapper">
                                <Shield size={20} />
                                {pendingCount > 0 && <span className="badge" />}
                            </div>
                        </button>
                    )}

                    <div className="credits-display" title="Your Credits">
                        <Coins size={16} className="text-yellow-500" />
                        <span className="credits-text">{credits}</span>
                    </div>
                </div>

                <div className="sidebar-bottom">
                    <button className="nav-item" onClick={handleLogout} title="Sign Out">
                        <LogOut size={20} />
                    </button>
                </div>

                <style jsx>{`
                    .sidebar {
                        grid-area: sidebar;
                        background: var(--bg-panel);
                        border-right: 1px solid var(--border-color);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        padding: 12px 0;
                        width: 50px;
                    }
                    .sidebar-top, .sidebar-bottom {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        align-items: center;
                    }
                    .nav-item {
                        width: 36px;
                        height: 36px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        color: var(--text-secondary);
                        text-decoration: none;
                        background: transparent;
                        border: none;
                        cursor: pointer;
                        transition: all 0.2s;
                        position: relative;
                    }
                    .nav-item:hover {
                        background: var(--bg-panel-header);
                        color: var(--text-primary);
                    }
                    .nav-item.active {
                        background: var(--accent-blue);
                        color: white;
                    }
                    .admin-btn {
                        color: #fca5a5; /* Soft red tint */
                    }
                    .admin-btn:hover {
                        color: #f87171;
                    }
                    .icon-wrapper {
                        position: relative;
                        display: flex;
                    }
                    .badge {
                        position: absolute;
                        top: -2px;
                        right: -2px;
                        width: 8px;
                        height: 8px;
                        background-color: #ef4444; /* Red */
                        border-radius: 50%;
                        border: 1px solid var(--bg-panel);
                    }
                    .credits-display {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2px;
                        margin-top: 8px;
                        padding-top: 8px;
                        border-top: 1px solid rgba(255,255,255,0.1);
                    }
                    .credits-text {
                        font-size: 10px;
                        color: #fbbf24;
                        font-weight: bold;
                    }
                `}</style>
            </aside>
            {showAdmin && <AdminPanelModal onClose={() => { setShowAdmin(false); checkPending(); }} />}
        </>
    );
}
