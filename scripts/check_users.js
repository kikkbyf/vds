var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();
async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('First user:', JSON.stringify(users[0]));
        }
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
