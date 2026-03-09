import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { isAdminRole } from '@/lib/roles';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!isAdminRole(session?.user?.role)) {
            const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
            if (!isAdminRole(user?.role)) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Permanently delete
        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to reject user:', error);
        return NextResponse.json({ error: 'Failed to reject user' }, { status: 500 });
    }
}
