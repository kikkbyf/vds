import type { Prisma } from '@prisma/client';
import type { FullCreation, LibraryUserSummary } from '@/types/library';

export type CreationWithUser = Prisma.CreationGetPayload<{
    include: { user: true };
}>;

export function normalizeCreationType(value: string | null | undefined): FullCreation['creationType'] {
    if (value === 'extraction' || value === 'digital_human' || value === 'standard') {
        return value;
    }
    return undefined;
}

export function mapDbCreation(creation: CreationWithUser): FullCreation {
    return {
        id: creation.id,
        userId: creation.userId,
        prompt: creation.prompt,
        negative: creation.negative,
        aspectRatio: creation.aspectRatio,
        imageSize: creation.imageSize,
        shotPreset: creation.shotPreset,
        lightingPreset: creation.lightingPreset,
        focalLength: creation.focalLength,
        guidance: creation.guidance,
        inputImageUrls: typeof creation.inputImageUrls === 'string'
            ? JSON.parse(creation.inputImageUrls || '[]')
            : creation.inputImageUrls,
        outputImageUrl: creation.outputImageUrl,
        status: creation.status,
        createdAt: creation.createdAt,
        sessionId: creation.sessionId ?? undefined,
        creationType: normalizeCreationType(creation.creationType),
        visible: creation.visible,
        deletedAt: creation.deletedAt,
        user: creation.user
            ? {
                name: creation.user.name,
                email: creation.user.email,
                image: creation.user.image ?? null,
            }
            : null,
    };
}

export function buildUserSummaries(creations: FullCreation[]): LibraryUserSummary[] {
    const grouped = new Map<string, FullCreation[]>();

    creations.forEach((creation) => {
        const items = grouped.get(creation.userId) ?? [];
        items.push(creation);
        grouped.set(creation.userId, items);
    });

    return Array.from(grouped.entries())
        .map(([userId, items]) => {
            const sortedItems = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latest = sortedItems[0];

            return {
                userId,
                user: latest?.user ?? null,
                latestImageUrl: latest?.outputImageUrl ?? null,
                latestCreatedAt: latest?.createdAt ?? null,
                creationCount: items.length,
            };
        })
        .sort((a, b) => new Date(b.latestCreatedAt ?? 0).getTime() - new Date(a.latestCreatedAt ?? 0).getTime());
}
