'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function getLibrary(): Promise<{ creations: any[], isAdmin: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { creations: [], isAdmin: false };

    try {
        // Check user role
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        // If ADMIN, show all. If USER, show only theirs.
        const where = user?.role === 'ADMIN' ? {} : { userId: session.user.id };

        const creations = await prisma.creation.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            include: { user: true } // Optional: include user info so admin knows who made it
        });
        return {
            creations,
            isAdmin: user?.role === 'ADMIN'
        };
    } catch (error) {
        console.error('Failed to fetch library:', error);
        return { creations: [], isAdmin: false };
    }
}
