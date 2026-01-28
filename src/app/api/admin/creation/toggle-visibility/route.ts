import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Double check admin role
        if (session?.user?.role !== 'ADMIN') {
            // Fallback DB check
            const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
            if (user?.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const body = await req.json();
        const { creationId, visible } = body;

        if (!creationId || typeof visible !== 'boolean') {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const updated = await prisma.creation.update({
            where: { id: creationId },
            data: { visible }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to toggle visibility:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
