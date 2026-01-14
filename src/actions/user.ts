'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function getUserCredits() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });
        return user?.credits ?? 0;
    } catch (error) {
        return 0;
    }
}
