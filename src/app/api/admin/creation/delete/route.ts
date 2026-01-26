import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
            if (user?.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const body = await req.json();
        const { creationId } = body;

        if (!creationId) {
            return NextResponse.json({ error: 'Creation ID required' }, { status: 400 });
        }

        // Soft delete
        const updated = await prisma.creation.update({
            where: { id: creationId },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to delete creation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
