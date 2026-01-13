import { getLibrary } from '@/actions/getLibrary';
import LibraryGrid from './LibraryGrid';
import { Sidebar } from 'lucide-react'; // Typo import, we need actual sidebar layout handling if we want it global
// Actually the Sidebar is in the layout/page structure. 
// However, the /library page will render as children of RootLayout.
// BUT, our Home page defined its own Grid Layout which INCLUDED the Sidebar.
// The RootLayout is just <html><body>.
// So /library needs its own Layout wrapper OR we should move shared layout to `app/layout.tsx`.
// FOR NOW: Let's replicate the structure or make a minimal layout for Library.

// Better approach: Upgrade RootLayout to have Sidebar?
// User asked for "Simple". 
// Let's just make the Library page have a Sidebar too, or move Sidebar to layout.js.
// Since Home page has "sidebar studio render inspector" structure, it's very specific.
// Library page should probably be simpler. 
// Let's adopt a "Sidebar + Main Content" layout for the Library page.

import SideMenu from '@/components/layout/Sidebar'; // Renaming to avoid conflict with Lucide icon

export default async function LibraryPage() {
    const creations = await getLibrary();

    return (
        <div className="library-layout">
            <SideMenu />

            <main className="library-content">
                <header className="library-header">
                    <h1>My Library</h1>
                    <span className="count">{creations.length} CREATIONS</span>
                </header>

                <div className="scroll-area">
                    <LibraryGrid creations={creations as any} />
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
