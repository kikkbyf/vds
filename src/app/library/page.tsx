import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import LibraryContent from './LibraryContent';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import type { FullCreation, LibraryUserSummary } from '@/types/library';
import { isAdminRole } from '@/lib/roles';
import { buildUserSummaries, mapDbCreation, normalizeCreationType } from '@/lib/library';

type LocalCreationLike = {
    id: string;
    userId: string;
    prompt: string;
    negative?: string | null;
    aspectRatio: string;
    imageSize: string;
    shotPreset?: string | null;
    lightingPreset?: string | null;
    focalLength?: number | null;
    guidance?: number | null;
    inputImageUrls: string[];
    outputImageUrl: string;
    status: string;
    createdAt: Date | string;
    sessionId?: string | null;
    creationType?: string | null;
    visible?: boolean;
    deletedAt?: Date | string | null;
    user?: FullCreation['user'];
};

function normalizeLocalCreation(item: LocalCreationLike): FullCreation {
    return {
        id: item.id,
        userId: item.userId,
        prompt: item.prompt,
        negative: item.negative ?? null,
        aspectRatio: item.aspectRatio,
        imageSize: item.imageSize,
        shotPreset: item.shotPreset ?? null,
        lightingPreset: item.lightingPreset ?? null,
        focalLength: item.focalLength ?? null,
        guidance: item.guidance ?? null,
        inputImageUrls: Array.isArray(item.inputImageUrls) ? item.inputImageUrls : [],
        outputImageUrl: item.outputImageUrl,
        status: item.status,
        createdAt: new Date(item.createdAt),
        sessionId: item.sessionId ?? undefined,
        creationType: normalizeCreationType(item.creationType),
        visible: item.visible ?? true,
        deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        user: item.user
            ? {
                name: item.user.name ?? null,
                email: item.user.email,
                image: item.user.image ?? null,
            }
            : null,
    };
}

export default async function LibraryPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    // Direct DB Query (No Server Action)
    let user: { role: string } | null = null;
    let creations: FullCreation[] = [];
    let userSummaries: LibraryUserSummary[] = [];
    let totalCreations = 0;
    let isAdmin = false;

    try {
        user = await prisma.user.findUnique({ where: { id: session.user.id } });
        isAdmin = isAdminRole(user?.role);

        const where: Prisma.CreationWhereInput = isAdmin ? {} : { userId: session.user.id };

        // Non-admins (and arguably admins too, unless separate view) shouldn't see soft-deleted items by default
        // But for "Hide" logic:
        if (!isAdmin) {
            where.visible = true;
            where.deletedAt = null;
        } else {
            // Admins see everything, but we might want to filter soft-deleted by default unless in a special "trash" view?
            // For now, let admins see everything but we'll visually mark them.
            // Actually, let's hide deletedAt != null for everyone in the main grid unless requested.
            where.deletedAt = null;
        }

        if (isAdmin) {
            const grouped = await prisma.creation.groupBy({
                by: ['userId'],
                where,
                _count: { _all: true },
                _max: { createdAt: true },
            });

            totalCreations = grouped.reduce((sum, item) => sum + item._count._all, 0);

            if (grouped.length > 0) {
                const users = await prisma.user.findMany({
                    where: { id: { in: grouped.map((item) => item.userId) } },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        creations: {
                            where: { deletedAt: null },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                outputImageUrl: true,
                                createdAt: true,
                            },
                        },
                    },
                });

                const countsByUserId = new Map(grouped.map((item) => [item.userId, item._count._all]));
                userSummaries = users
                    .map((dbUser) => ({
                        userId: dbUser.id,
                        user: {
                            name: dbUser.name,
                            email: dbUser.email,
                            image: dbUser.image ?? null,
                        },
                        latestImageUrl: dbUser.creations[0]?.outputImageUrl ?? null,
                        latestCreatedAt: dbUser.creations[0]?.createdAt ?? null,
                        creationCount: countsByUserId.get(dbUser.id) ?? 0,
                    }))
                    .sort((a, b) => new Date(b.latestCreatedAt ?? 0).getTime() - new Date(a.latestCreatedAt ?? 0).getTime());
            }
        } else {
            const dbCreations = await prisma.creation.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: { user: true }
            });

            creations = dbCreations.map(mapDbCreation);
            totalCreations = creations.length;
        }
    } catch {
        console.warn("DB Connection failed, switching to Local File Mode");
        // Fallback to local file system scan
        const { getLocalCreations } = await import('@/lib/localLibrary');
        const localCreations = await getLocalCreations();
        creations = localCreations.map((item) => normalizeLocalCreation(item as LocalCreationLike));
        totalCreations = creations.length;
        isAdmin = true; // Always admin in local dev
        userSummaries = buildUserSummaries(creations);
    }

    // [LOCAL-DEV-ENHANCEMENT] 
    // Always merge local file system logs in development mode
    // This allows viewing history even if DB is used for new transient data
    if (process.env.NODE_ENV === 'development' || process.env.DATABASE_URL?.startsWith('file:')) {
        console.log("Merging local file system logs...");
        try {
            const { getLocalCreations } = await import('@/lib/localLibrary');
            const fileCreations = (await getLocalCreations()).map((item) => normalizeLocalCreation(item as LocalCreationLike));
            if (fileCreations.length > 0) {
                // Merge and dedup by ID (if necessary, though local IDs are usually timestamps/UUIDs)
                const existingIds = new Set(creations.map(c => c.id));
                const newFiles = fileCreations.filter(fc => !existingIds.has(fc.id));
                creations = [...creations, ...newFiles];

                // Sort combined list
                creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                // [LOCAL-DEV-ENHANCEMENT] FORCE SINGLE ADMIN USER
                // Override all user info to match the dev bypass account
                // This prevents multiple folders (e.g. "dev@local", "admin@example.com") from appearing in the UI
                creations = creations.map(c => ({
                    ...c,
                    userId: 'dev-admin',
                    user: {
                        name: 'Admin',
                        email: 'admin@example.com',
                        image: null,
                        ...c.user // Keep existing if needed, but email/id is key for grouping
                    }
                }));

                userSummaries = buildUserSummaries(creations);
                totalCreations = creations.length;
                isAdmin = true; // Ensure admin view to see the groups
            }
        } catch (e) {
            console.warn("Failed to merge local file creations", e);
        }
    }

    return (
        <main className="studio-layout">
            <LibraryContent creations={creations} userSummaries={userSummaries} totalCreations={totalCreations} isAdmin={isAdmin} />
        </main>
    );
}
