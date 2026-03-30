const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = "mgrdegh@web.de";
        console.log(`Checking user: ${email}...`);
        
        const user = await prisma.user.findUnique({
            where: { email },
            include: { organization: true }
        });

        if (!user) {
            console.error('User not found!');
            return;
        }

        console.log('User found:', user.id);
        console.log('Role:', user.role);
        console.log('OrganizationId:', user.organizationId);
        console.log('Organization:', user.organization ? user.organization.name : 'None');

        if (user.role !== 'ADMIN') {
            console.log('ISSUE: User is not ADMIN.');
        } else {
            console.log('User role is correct.');
        }

        if (!user.organizationId) {
            console.log('ISSUE: User has no Organization.');
        } else {
            console.log('User organization is correct.');
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
