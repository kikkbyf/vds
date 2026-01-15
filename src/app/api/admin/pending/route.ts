import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const count = await prisma.user.count({
            where: { approved: false }
        });
        // We'll return an array to match the interface if needed, or just count.
        // The original action returned a list. The sidebar just checks .length. 
        // Let's perform a count is more efficient, but if the sidebar needs list...
        // Sidebar: "setPendingCount(list.length);"

        // Actually, let's keep it simple and just return the count in a JSON object,
        // and update the sidebar to use count.
        // OR return a dummy list of IDs to minimize change.
        // Let's do it properly: Fetch count.

        return NextResponse.json({ count });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch pending count' }, { status: 500 });
    }
}
