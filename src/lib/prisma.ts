import { PrismaClient } from '@prisma/client';

let hasLoggedPrismaDiagnostics = false;

const getDatabaseHost = () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return 'missing';

    try {
        return new URL(databaseUrl).host || 'unknown';
    } catch {
        return 'invalid';
    }
};

const prismaClientSingleton = () => {
    if (!hasLoggedPrismaDiagnostics) {
        hasLoggedPrismaDiagnostics = true;
        console.log('[prisma] init diagnostics', {
            commitSha: process.env.RAILWAY_GIT_COMMIT_SHA || 'missing',
            databaseHost: getDatabaseHost(),
            nodeEnv: process.env.NODE_ENV || 'unknown',
        });
    }

    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
