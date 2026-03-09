import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { isAdminRole } from '@/lib/roles';

export async function GET() {
    try {
        const session = await auth();
        // Check Admin Role
        if (!isAdminRole(session?.user?.role)) {
            const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
            if (!isAdminRole(user?.role)) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                approved: true,
                credits: true,
                createdAt: true,
                lastActiveAt: true,
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
