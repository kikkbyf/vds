import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import LibraryContent from './LibraryContent';
import { redirect } from 'next/navigation';

export default async function LibraryPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    // Direct DB Query (No Server Action)
    let user = null;
    let creations: any[] = [];
    let isAdmin = false;

    try {
        user = await prisma.user.findUnique({ where: { id: session.user.id } });
        isAdmin = user?.role === 'ADMIN';

        const where = isAdmin ? {} : { userId: session.user.id };

        creations = await prisma.creation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });

        // [LOCAL-DEV-FIX] SQLite Compatibility: Parse JSON strings back to Arrays
        // Since we use String type for arrays in SQLite schema
        creations = creations.map(c => ({
            ...c,
            inputImageUrls: typeof c.inputImageUrls === 'string'
                ? JSON.parse(c.inputImageUrls || '[]')
                : c.inputImageUrls,
        }));
    } catch (error) {
        console.warn("DB Connection failed, switching to Local File Mode");
        // Fallback to local file system scan
        const { getLocalCreations } = await import('@/lib/localLibrary');
        creations = await getLocalCreations();
        isAdmin = true; // Always admin in local dev
    }

    // [LOCAL-DEV-ENHANCEMENT] 
    // Always merge local file system logs in development mode
    // This allows viewing history even if DB is used for new transient data
    if (process.env.NODE_ENV === 'development' || process.env.DATABASE_URL?.startsWith('file:')) {
        console.log("Merging local file system logs...");
        try {
            const { getLocalCreations } = await import('@/lib/localLibrary');
            const fileCreations = await getLocalCreations();
            if (fileCreations.length > 0) {
                // Merge and dedup by ID (if necessary, though local IDs are usually timestamps/UUIDs)
                const existingIds = new Set(creations.map(c => c.id));
                const newFiles = fileCreations.filter(fc => !existingIds.has(fc.id));
                creations = [...creations, ...newFiles];

                // Sort combined list
                creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                // [LOCAL-DEV-ENHANCEMENT] FORCE SINGLE ADMIN USER
                // Override all user info to match the dev bypass account
                // This prevents multiple folders (e.g. "dev@local", "admin@example.com") from appearing in the UI
                creations = creations.map(c => ({
                    ...c,
                    userId: 'dev-admin',
                    user: {
                        name: 'Admin',
                        email: 'admin@example.com',
                        image: null,
                        ...c.user // Keep existing if needed, but email/id is key for grouping
                    }
                }));

                isAdmin = true; // Ensure admin view to see the groups
            }
        } catch (e) {
            console.warn("Failed to merge local file creations", e);
        }
    }

    return (
        <main className="studio-layout">
            <LibraryContent creations={creations as any} isAdmin={isAdmin} />
        </main>
    );
}
