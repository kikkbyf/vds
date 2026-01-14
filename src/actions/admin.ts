'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to check admin role
async function verifyAdmin() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
        if (user?.role !== 'ADMIN') {
            throw new Error('Unauthorized: Admin access required');
        }
    }
    return true;
}

export async function getAllUsers() {
    try {
        await verifyAdmin();

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
    try {
        await verifyAdmin();

        const oldUser = await prisma.user.findUnique({ where: { id: userId } });
        const oldCredits = oldUser?.credits ?? 0;
        const diff = credits - oldCredits;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits }
            }),
            prisma.creditLog.create({
                data: {
                    userId,
                    amount: diff,
                    reason: 'Admin Adjustment'
                }
            })
        ]);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update credits:', error);
        return { error: error.message || 'Failed to update' };
    }
}

export async function getUserLogs(userId: string) {
    try {
        // Special case: Admin can see anyone, User can see self
        const session = await auth();
        const isSelf = session?.user?.id === userId;

        if (!isSelf) {
            // If not self, must be admin
            await verifyAdmin();
        }

        const logs = await prisma.creditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return logs;
    } catch (e) {
        return [];
    }
}

export async function getPendingUsers() {
    try {
        await verifyAdmin();

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
    try {
        await verifyAdmin();

        await prisma.user.update({
            where: { id: userId },
            data: { approved: true }
        });
        return { success: true };
    } catch (error: any) {
        console.error('Failed to approve user:', error);
        return { error: error.message || 'Failed to approve' };
    }
}

export async function rejectUser(userId: string) {
    try {
        await verifyAdmin();

        // Permanently delete the registration request
        await prisma.user.delete({
            where: { id: userId }
        });
        return { success: true };
    } catch (error: any) {
        console.error('Failed to reject user:', error);
        return { error: error.message || 'Failed to reject' };
    }
}
