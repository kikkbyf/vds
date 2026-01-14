const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'yifan.bu17@gmail.com';
    console.log(`Approving admin user: ${email}...`);
    try {
        await prisma.user.update({
            where: { email },
            data: { approved: true, role: 'ADMIN' },
        });
        console.log('Success: Admin approved.');
    } catch (e) {
        console.error('Error (user might not exist yet):', e.message);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
