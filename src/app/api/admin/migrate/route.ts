import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 300; // 5 minutes max for migration

export async function GET(req: NextRequest) {
    // 1. Security Check
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    console.log('🔄 [Admin API] Starting Session Migration...');

    try {
        // Get all creations sorted by user and time
        const creations = await prisma.creation.findMany({
            orderBy: [
                { userId: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        let updatedCount = 0;
        let lastUser = null;
        let lastTime = 0;
        let currentSessionId = null;

        // Time window for grouping (e.g., 5 minutes)
        const SESSION_WINDOW_MS = 5 * 60 * 1000;

        for (const creation of creations) {
            const timestamp = new Date(creation.createdAt).getTime();

            // 1. Infer Creation Type (if not already set)
            // If creationType is already set, we might skip or re-evaluate. 
            // For safety, let's only set if missing or if we want to force refresh.
            // Let's force refresh for consistency with the script.

            let type = 'standard';
            const p = (creation.prompt || '').toLowerCase(); // Ensure lower case matching
            if (p.includes('horizontal character sheet') || p.includes('2x2 grid image') || p.includes('character reference sheet')) {
                type = 'extraction';
            } else if (p.includes('digital human') || p.includes('best quality')) {
                type = 'standard'; // Will be refined later
            }

            // 2. Infer Session ID
            // STRICT MODE: User requested "one by one separate" for legacy data.
            // We do NOT use time window grouping for historical backfill. 
            // Every item gets its own unique session to preserve original "individual" state.
            currentSessionId = uuidv4();

            // Update state (kept for reference or if we revert to grouping)
            lastUser = creation.userId;
            lastTime = timestamp;

            // Update state
            lastUser = creation.userId;
            lastTime = timestamp;

            // Perform Update
            await prisma.creation.update({
                where: { id: creation.id },
                data: {
                    sessionId: currentSessionId,
                    creationType: type
                }
            });

            updatedCount++;
        }

        // 3. Post-process: Mark 'standard' as 'digital_human' if session contains 'extraction'
        // Get all sessions with at least one extraction
        const extractionSessions = await prisma.creation.groupBy({
            by: ['sessionId'],
            where: { creationType: 'extraction' }
        });

        const sessionIds = extractionSessions.map(s => s.sessionId as string).filter(Boolean);
        let upgradedCount = 0;

        if (sessionIds.length > 0) {
            const updateResult = await prisma.creation.updateMany({
                where: {
                    sessionId: { in: sessionIds },
                    creationType: 'standard'
                },
                data: { creationType: 'digital_human' }
            });
            upgradedCount = updateResult.count;
        }

        return NextResponse.json({
            success: true,
            totalProcessed: updatedCount,
            upgradedToDigitalHuman: upgradedCount,
            message: `Migration Complete! Processed ${updatedCount} records.`
        });

    } catch (error) {
        console.error('Migration Failed:', error);
        return NextResponse.json({ error: 'Migration Internal Error', details: String(error) }, { status: 500 });
    }
}
