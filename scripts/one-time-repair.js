
const { PrismaClient } = require('@prisma/client');

// Use Xata connection string found in check-db-count.js
process.env.DATABASE_URL = "postgresql://xata:YnsbHXmNwjT9QSx4pglzb9XI97vy6iaQKCjstRZhQCC16yTb5QOFnVNFc7uQZpCY@rsksfldqap37rbkrgov1ufr8c0.us-east-1.xata.tech:5432/xata?sslmode=require&connection_limit=1";

const prisma = new PrismaClient();

function repairMojibake(str) {
    if (!str) return str;
    // Common patterns for double-encoded UTF-8 as Latin1
    if (str.includes('Ã') || str.includes('â') || str.includes('©') || str.includes('®')) {
        try {
            const buf = Buffer.from(str, 'latin1');
            const decoded = buf.toString('utf8');
            if (!decoded.includes('')) {
                return decoded;
            }
        } catch (e) { }
    }
    return str;
}

async function main() {
    console.log('🚀 Starting Database Character Repair (Xata)...');

    // 1. Repair InvoiceItems
    const items = await prisma.invoiceItem.findMany({
        where: {
            OR: [
                { description: { contains: 'Ã' } },
                { description: { contains: 'â' } },
            ]
        }
    });

    console.log(`🔍 Found ${items.length} corrupted InvoiceItems.`);
    let fixedItems = 0;

    for (const item of items) {
        const repaired = repairMojibake(item.description);
        if (repaired !== item.description) {
            const normalized = repaired.toLowerCase()
                .replace(/[ _|]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            await prisma.invoiceItem.update({
                where: { id: item.id },
                data: {
                    description: repaired,
                    normalizedDescription: normalized
                }
            });
            fixedItems++;
        }
    }

    // 2. Repair Invoices
    const invoices = await prisma.invoice.findMany({
        where: {
            OR: [
                { customerName: { contains: 'Ã' } },
                { customerName: { contains: 'â' } },
                { headerSubject: { contains: 'Ã' } },
                { headerSubject: { contains: 'â' } },
            ]
        }
    });

    console.log(`🔍 Found ${invoices.length} corrupted Invoices.`);
    let fixedInvoices = 0;

    for (const inv of invoices) {
        let updateData = {};
        if (inv.customerName) {
            const r = repairMojibake(inv.customerName);
            if (r !== inv.customerName) updateData.customerName = r;
        }
        if (inv.headerSubject) {
            const r = repairMojibake(inv.headerSubject);
            if (r !== inv.headerSubject) updateData.headerSubject = r;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.invoice.update({
                where: { id: inv.id },
                data: updateData
            });
            fixedInvoices++;
        }
    }

    console.log(`✅ Repair Finished!`);
    console.log(`📊 Fixed Items: ${fixedItems}`);
    console.log(`📊 Fixed Invoices: ${fixedInvoices}`);
}

main()
    .catch(e => {
        console.error('❌ Repair Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
