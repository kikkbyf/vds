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
    } catch (error) {
        console.warn("DB Connection failed, switching to Local File Mode");
        // Fallback to local file system scan
        const { getLocalCreations } = await import('@/lib/localLibrary');
        creations = await getLocalCreations();
        isAdmin = true; // Always admin in local dev
    }

    return (
        <main className="studio-layout">
            <LibraryContent creations={creations as any} isAdmin={isAdmin} />
        </main>
    );
}
