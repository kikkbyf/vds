'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function getPendingUsers() {
    const session = await auth();
    // Only ADMIN can see this
    if (session?.user?.email !== 'yifan.bu17@gmail.com' && session?.user?.role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
        if (user?.role !== 'ADMIN') return [];
    }

    try {
        const users = await prisma.user.findMany({
            where: { approved: false },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                createdAt: true,
            }
        });
        return users;
    } catch (error) {
        console.error('Failed to fetch pending users:', error);
        return [];
    }
}

export async function approveUser(userId: string) {
    const session = await auth();
    // Security check
    const currentUser = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    if (currentUser?.role !== 'ADMIN') return { error: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { approved: true }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to approve user:', error);
        return { error: 'Failed to approve' };
    }
}
