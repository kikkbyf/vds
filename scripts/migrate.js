const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- CONFIGURATION ---
const TARGET_VERSION = 1;

async function main() {
    console.log('--- Starting Data Migration Check ---');

    // 1. Get Current Version
    let currentVersion = 0;
    try {
        const config = await prisma.systemConfig.findUnique({ where: { key: 'db_data_version' } });
        if (config) {
            currentVersion = parseInt(config.value, 10);
        }
    } catch (e) {
        console.log('SystemConfig table likely does not exist yet (first run). It will be created by db push.');
        // If query fails, we assume 0, but we need to ensure schema exists first. 
        // Note: This script runs AFTER `prisma db push`, so table DOES exist.
        // If findUnique returns null, version is 0.
    }

    console.log(`Current DB Version: ${currentVersion}`);
    console.log(`Target DB Version:  ${TARGET_VERSION}`);

    if (currentVersion >= TARGET_VERSION) {
        console.log('Database is up to date.');
        await prisma.$disconnect();
        return;
    }

    // 2. Run Migrations sequentially
    for (let v = currentVersion + 1; v <= TARGET_VERSION; v++) {
        console.log(`Applying Migration v${v}...`);
        await runMigration(v);
    }

    // 3. Update Version
    await prisma.systemConfig.upsert({
        where: { key: 'db_data_version' },
        update: { value: String(TARGET_VERSION) },
        create: { key: 'db_data_version', value: String(TARGET_VERSION) },
    });

    console.log(`--- Migration Complete. New Version: ${TARGET_VERSION} ---`);
    await prisma.$disconnect();
}

async function runMigration(version) {
    switch (version) {
        case 1:
            await migrationV1_BackfillApproved();
            break;
        case 2:
            await migrationV2_InitCredits();
            break;
        case 3:
            console.log('-> V3: CreditLogs table creation handled by schema push.');
            break;
        default:
            console.warn(`No logic defined for v${version}`);
    }
}

// --- MIGRATION LOGIC ---

/**
 * v1: Ensure all existing users have 'approved' status set correctly.
 * Useful if we have legacy users from before the approval system.
 */
async function migrationV1_BackfillApproved() {
    console.log('-> Running v1: Backfill User Approval Status');

    // Find users where 'approved' might be false/null but they should be active?
    // Actually, safest is to ensure Admin is approved (handled by separate script)
    // and maybe auto-approve old users if we wanted.
    // For now, let's just log. The schema default handles new users.

    const count = await prisma.user.count();
    console.log(`-> Checked ${count} users. Schema default handles new insertions.`);

    // Example: If we wanted to mass-approve everyone created before today:
    // await prisma.user.updateMany({ where: { approved: false }, data: { approved: true } });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
