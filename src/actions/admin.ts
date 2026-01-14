'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function getAllUsers() {
    const session = await auth();
    // Only ADMIN can see this
    if (session?.user?.role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
        if (user?.role !== 'ADMIN') return [];
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                approved: true,
                credits: true,
                createdAt: true,
            }
        });
        return users;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
    }
}

export async function updateUserCredits(userId: string, credits: number) {
    const session = await auth();
    const currentUser = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    if (currentUser?.role !== 'ADMIN') return { error: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { credits }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to update credits:', error);
        return { error: 'Failed to update' };
    }
}

export async function getPendingUsers() {
    // ... existing logic but maybe we don't need it if getAllUsers exists? 
    // Let's keep it for the badge count logic, but AdminPanel can switch to consume getAllUsers.
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
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

export async function rejectUser(userId: string) {
    const session = await auth();
    const currentUser = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    if (currentUser?.role !== 'ADMIN') return { error: 'Unauthorized' };

    try {
        // Permanently delete the registration request
        await prisma.user.delete({
            where: { id: userId }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to reject user:', error);
        return { error: 'Failed to reject' };
    }
}
