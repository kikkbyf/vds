import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.id === 'dev-admin') {
            return NextResponse.json({ ok: true, dev: true });
        }

        try {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { lastActiveAt: new Date() }
            });
        } catch (e: any) {
            // Ignore "Record not found" in dev/synching scenarios
            if (e.code === 'P2025') {
                return NextResponse.json({ ok: true, ignored: true });
            }
            throw e;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Heartbeat failed:', error);
        return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
    }
}
