/* eslint-disable @typescript-eslint/no-require-imports */
var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();
async function main() {
    const email = process.argv[2];
    try {
        const users = await prisma.user.findMany({
            where: email ? { email } : undefined,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                approved: true,
                credits: true,
                createdAt: true
            }
        });
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log(JSON.stringify(users, null, 2));
        }
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
