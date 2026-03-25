import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { isAdminRole } from '@/lib/roles';
import { mapDbCreation } from '@/lib/library';

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (!isAdminRole(currentUser?.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const creations = await prisma.creation.findMany({
        where: {
            userId,
            deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true },
    });

    return NextResponse.json({
        creations: creations.map(mapDbCreation),
    });
}
