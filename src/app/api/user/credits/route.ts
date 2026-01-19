import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ credits: 0 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });
        return NextResponse.json({ credits: user?.credits ?? 0 });
    } catch (error) {
        console.warn('DB Connection Failed, using mock credits', error);
        // Fallback for Demo Mode / No DB
        return NextResponse.json({ credits: 100 });
    }
}
