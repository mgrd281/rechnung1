const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fix() {
    console.log('Running Admin Password Fix...');
    try {
        const email = 'mgrdegh@web.de';
        const password = '1532@@@';

        console.log(`Hashing password for ${email}...`);
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Upserting user...');
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword
            },
            create: {
                email,
                passwordHash: hashedPassword,
                name: 'Admin',
                role: 'ADMIN'
            }
        });

        console.log(`✅ Password fixed for user: ${user.id}`);
    } catch (e) {
        console.error('❌ Failed to fix password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
