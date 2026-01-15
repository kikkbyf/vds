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
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const isAdmin = user?.role === 'ADMIN';

    const where = isAdmin ? {} : { userId: session.user.id };

    const creations = await prisma.creation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    return (
        <main className="studio-layout">
            <LibraryContent creations={creations as any} isAdmin={isAdmin} />
        </main>
    );
}
