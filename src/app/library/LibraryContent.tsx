'use client';

import { useState } from 'react';
import LibraryGrid from './LibraryGrid';
import SideMenu from '@/components/layout/Sidebar';
import { Bug } from 'lucide-react';
import dynamic from 'next/dynamic';

const DebugLogModal = dynamic(() => import('@/components/library/DebugLogModal'), { ssr: false });

export default function LibraryContent({ creations }: { creations: any[] }) {
    const [showLogs, setShowLogs] = useState(false);

    return (
        <div className="library-layout">
            <SideMenu />

            <main className="library-content">
                <header className="library-header">
                    <div className="flex items-center gap-4">
                        <h1>My Library</h1>
                        <span className="count">{creations.length} CREATIONS</span>
                    </div>

                    <button
                        onClick={() => setShowLogs(true)}
                        className="debug-btn"
                        title="View Generation Logs"
                    >
                        <Bug size={16} />
                        <span>Logs</span>
                    </button>
                </header>

                <div className="scroll-area">
                    <LibraryGrid creations={creations} />
                </div>
            </main>

            {showLogs && <DebugLogModal onClose={() => setShowLogs(false)} />}

            <style jsx>{`
                .library-layout {
                    display: grid;
                    grid-template-columns: 50px 1fr;
                    grid-template-areas: "sidebar content";
                    height: 100vh;
                    background: var(--bg-app);
                }
                
                .library-content {
                    grid-area: content;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .library-header {
                    height: 60px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    background: var(--bg-panel);
                }

                h1 {
                    font-size: 18px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .count {
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-family: monospace;
                    background: var(--bg-app);
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .debug-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-secondary);
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .debug-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: var(--text-primary);
                }

                .scroll-area {
                    flex: 1;
                    overflow-y: auto;
                }
            `}</style>
        </div>
    );
}
