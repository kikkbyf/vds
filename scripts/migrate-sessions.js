const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function migrate() {
    console.log('🔄 Starting Session Migration...');

    // Get all creations sorted by user and time
    const creations = await prisma.creation.findMany({
        orderBy: [
            { userId: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    console.log(`Found ${creations.length} creations to process.`);

    let updatedCount = 0;
    let lastUser = null;
    let lastTime = 0;
    let currentSessionId = null;

    // Time window for grouping (e.g., 5 minutes)
    const SESSION_WINDOW_MS = 5 * 60 * 1000;

    for (const creation of creations) {
        const timestamp = new Date(creation.createdAt).getTime();

        // 1. Infer Creation Type
        let type = 'standard';
        const p = creation.prompt || '';
        if (p.includes('Horizontal Character Sheet') || p.includes('2x2 Grid Image') || p.includes('detailed character reference sheet')) {
            type = 'extraction';
        } else if (p.includes('Digital Human') || p.includes('Best quality, photo-realistic')) {
            // Heuristic for Digital Human if followed by extraction? 
            // Simplification: verify via session later? 
            // For backfill, let's stick to prompt keywords or default 'standard' -> 'digital_human' if session has extractions later.
            type = 'standard'; // Will be refined later
        }

        // 2. Infer Session ID
        // STRICT MODE: User requested "one by one separate" for legacy data.
        currentSessionId = uuidv4();

        // Update state
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
        if (updatedCount % 10 === 0) process.stdout.write('.');
    }

    console.log('\n✅ Basic grouping complete.');

    // 3. Post-process: Mark 'standard' as 'digital_human' if session contains 'extraction'
    console.log('🔄 Refining Digital Human types...');

    // Get all sessions with at least one extraction
    const extractionSessions = await prisma.creation.groupBy({
        by: ['sessionId'],
        where: { creationType: 'extraction' }
    });

    const sessionIds = extractionSessions.map(s => s.sessionId).filter(Boolean);

    if (sessionIds.length > 0) {
        const updateResult = await prisma.creation.updateMany({
            where: {
                sessionId: { in: sessionIds },
                creationType: 'standard'
            },
            data: { creationType: 'digital_human' }
        });
        console.log(`✨ Upgraded ${updateResult.count} standard images to 'digital_human' based on context.`);
    }

    console.log(`\n🎉 Migration Complete! Processed ${updatedCount} records.`);
}

migrate()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
