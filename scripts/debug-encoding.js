
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const invoiceId = "3027b40d-d9b8-466d-8813-f661cd879d75"; // Example ID, I'll search by number
    const inv = await prisma.invoice.findFirst({
        where: { invoiceNumber: "##3674" },
        include: { items: true }
    });

    if (!inv) {
        console.log("Invoice not found");
        return;
    }

    console.log("--- Raw DB Content Analysis ---");
    for (const item of inv.items) {
        console.log(`Description: ${item.description}`);
        const buf = Buffer.from(item.description);
        console.log(`Hex: ${buf.toString('hex')}`);

        // Check if it's already double-encoded
        const asLatin1 = buf.toString('latin1');
        console.log(`As Latin1: ${asLatin1}`);

        try {
            const fixed = Buffer.from(item.description, 'latin1').toString('utf8');
            console.log(`Attempted Fix (latin1->utf8): ${fixed}`);
        } catch (e) { }
    }
}

main().finally(() => prisma.$disconnect());
