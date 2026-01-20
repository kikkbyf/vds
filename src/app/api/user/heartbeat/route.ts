import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Heartbeat failed:', error);
        return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
    }
}
