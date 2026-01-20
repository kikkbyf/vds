
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const groups = await prisma.assetGroup.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name = 'New Group' } = await req.json();

    const group = await prisma.assetGroup.create({
        data: {
            userId: session.user.id,
            name,
            assets: [], // Start empty
        },
    });

    return NextResponse.json(group);
}
