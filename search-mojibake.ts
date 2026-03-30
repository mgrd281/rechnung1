
import { prisma } from './lib/prisma';

async function main() {
    console.log('Searching for mojibake...');
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

    console.log(`Found ${items.length} items with potential mojibake.`);
    items.forEach(item => {
        console.log(`ID: ${item.id}, Description: ${item.description}`);
    });

    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: 'â' } },
                { name: { contains: 'Ã' } }
            ]
        },
        take: 10
    });

    console.log(`Found ${customers.length} customers with potential mojibake.`);
    customers.forEach(c => {
        console.log(`ID: ${c.id}, Name: ${c.name}`);
    });
}

main().catch(console.error);
