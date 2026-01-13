'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function savePromptTemplate(name: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await prisma.promptTemplate.create({
        data: {
            userId: session.user.id,
            name,
            content,
        },
    });
    revalidatePath('/studio'); // Or wherever we show it
}

export async function getPromptTemplates() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.promptTemplate.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    });
}
