const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking for Mojibake ---');

    const items = await prisma.invoiceItem.findMany({
        where: {
            OR: [
                { description: { contains: 'â' } },
                { description: { contains: 'Ã' } },
                { description: { contains: '' } }
            ]
        },
        take: 10
    });

    console.log(`Found ${items.length} items with potential issues.`);

    items.forEach(item => {
        console.log(`ID: ${item.id}`);
        console.log(`Raw: "${item.description}"`);
        // Print hex codes to see what's actually there
        const hex = Buffer.from(item.description).toString('hex');
        console.log(`Hex: ${hex}`);

        // Check if normalizedDescription exists and what it is
        console.log(`Normalized: "${item.normalizedDescription}"`);
        console.log('---');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
