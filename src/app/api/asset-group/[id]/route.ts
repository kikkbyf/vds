
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const group = await prisma.assetGroup.findUnique({
        where: { id: params.id },
    });

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (group.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, assets } = await req.json();

    try {
        const group = await prisma.assetGroup.update({
            where: {
                id: params.id,
                userId: session.user.id, // Security check: ensure own group
            },
            data: {
                ...(name && { name }),
                ...(assets && { assets }), // Full replacement of assets JSON
            },
        });
        return NextResponse.json(group);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await prisma.assetGroup.delete({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}
