'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function getLibrary() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const creations = await prisma.creation.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return creations;
    } catch (error) {
        console.error('Failed to fetch library:', error);
        return [];
    }
}
