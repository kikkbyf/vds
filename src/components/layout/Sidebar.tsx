'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Image as ImageIcon, LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} title="Studio">
                    <Home size={20} />
                </Link>
                <Link href="/library" className={`nav-item ${isActive('/library') ? 'active' : ''}`} title="My Library">
                    <ImageIcon size={20} />
                </Link>
            </div>

            <div className="sidebar-bottom">
                <button className="nav-item" onClick={() => signOut()} title="Sign Out">
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
                }
                .nav-item:hover {
                    background: var(--bg-panel-header);
                    color: var(--text-primary);
                }
                .nav-item.active {
                    background: var(--accent-blue);
                    color: white;
                }
            `}</style>
        </aside>
    );
}
