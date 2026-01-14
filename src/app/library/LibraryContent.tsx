'use client';

import LibraryGrid from './LibraryGrid';
import SideMenu from '@/components/layout/Sidebar';
import { Creation } from '@prisma/client';

export default function LibraryContent({ creations }: { creations: any[] }) {
    return (
        <div className="library-layout">
            <SideMenu />

            <main className="library-content">
                <header className="library-header">
                    <h1>My Library</h1>
                    <span className="count">{creations.length} CREATIONS</span>
                </header>

                <div className="scroll-area">
                    <LibraryGrid creations={creations} />
                </div>
            </main>

            <style jsx>{`
                .library-layout {
                    display: grid;
                    grid-template-columns: 50px 1fr;
                    height: 100vh;
                    background: var(--bg-app);
                }
                
                .library-content {
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

                .scroll-area {
                    flex: 1;
                    overflow-y: auto;
                }
            `}</style>
        </div>
    );
}
