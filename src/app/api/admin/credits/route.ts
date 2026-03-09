import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { isAdminRole } from '@/lib/roles';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Failed to update';
}

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
        const { userId, credits } = body;

        if (!userId || typeof credits !== 'number') {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const oldUser = await prisma.user.findUnique({ where: { id: userId } });
        const oldCredits = oldUser?.credits ?? 0;
        const diff = credits - oldCredits;

        // Transaction for consistency
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

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to update credits:', error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
