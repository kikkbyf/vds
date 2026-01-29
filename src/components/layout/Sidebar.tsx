'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TaskQueuePanel } from './TaskQueuePanel';
import { Home, Image as ImageIcon, LogOut, Shield, Coins, FolderOpen, RefreshCcw, List } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useAssetStore } from '@/store/useAssetStore';
import dynamic from 'next/dynamic';

const AdminPanelModal = dynamic(() => import('@/components/library/AdminPanelModal'), { ssr: false });
const AssetManagerDrawer = dynamic(() => import('@/components/assets/AssetManagerDrawer'), { ssr: false });

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const [showAdmin, setShowAdmin] = useState(false);
    const [showTasks, setShowTasks] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Global Store
    const credits = useStudioStore(s => s.credits);
    const activeTasks = useStudioStore(s => s.activeTasks);
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
                    <Link href="/faceswap" className={`nav-item ${isActive('/faceswap') ? 'active' : ''}`} title="AI 换脸">
                        <RefreshCcw size={20} />
                    </Link>

                    <button
                        className={`nav-item ${useAssetStore(s => s.isDrawerOpen) ? 'active' : ''}`}
                        onClick={() => useAssetStore.getState().toggleDrawer()}
                        title="Asset Manager"
                    >
                        <FolderOpen size={20} />
                    </button>

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
                    {/* Task Queue Trigger */}
                    <div className="relative group">
                        <button
                            className={`nav-item ${activeTasks.length > 0 ? 'text-blue-400' : ''}`}
                            onClick={() => setShowTasks(!showTasks)}
                            title="Task Queue"
                        >
                            <List size={20} />
                            {activeTasks.length > 0 && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border border-[#1a1a1a]" />
                            )}
                        </button>

                        {/* Task Panel Popover - Fixed positioning to escape sidebar constraints */}
                        {showTasks && (
                            <div className="fixed left-[60px] bottom-4 w-80 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[99999]">
                                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        Task Queue ({activeTasks.length})
                                    </span>
                                    <button
                                        onClick={() => setShowTasks(false)}
                                        className="text-white/40 hover:text-white transition-colors h-6 w-6 flex items-center justify-center rounded hover:bg-white/10"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <TaskQueuePanel />
                            </div>
                        )}
                    </div>

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
            <AssetManagerDrawer />
        </>
    );
}
