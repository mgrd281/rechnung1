import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function fixMojibake(text: string): string {
    if (!text) return text;

    let fixed = text;
    // Common UTF-8 bytes misinterpreted as Latin-1 / Windows-1252
    const mappings: [RegExp, string][] = [
        [/Ã¤/g, 'ä'],
        [/Ã¶/g, 'ö'],
        [/Ã¼/g, 'ü'],
        [/Ã„/g, 'Ä'],
        [/Ã–/g, 'Ö'],
        [/Ãœ/g, 'Ü'],
        [/ÃŸ/g, 'ß'],
        [/â€“/g, '–'],
        [/â€”/g, '—'],
        [/â€™/g, '’'],
        [/â€/g, '"'],
        [/â€¢/g, '•'],
        [/â„¢/g, '™'],
        [/â€¦/g, '…'],
        [/Â/g, ''],
        [/â\|\|/g, '|'],
        [/â/g, ''],
    ];

    for (const [pattern, replacement] of mappings) {
        fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
}

function normalizeForSearch(text: string): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[-_|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function main() {
    console.log('Starting Deep Repair Job...');

    // 1. InvoiceItem
    const items = await prisma.invoiceItem.findMany();
    console.log(`Processing ${items.length} InvoiceItems...`);
    for (const item of items) {
        const fixed = fixMojibake(item.description);
        const normalized = normalizeForSearch(fixed);
        if (fixed !== item.description || normalized !== (item as any).normalizedDescription) {
            await prisma.invoiceItem.update({
                where: { id: item.id },
                data: {
                    description: fixed,
                    normalizedDescription: normalized
                } as any
            });
        }
    }

    // 2. Invoice
    const invoices = await prisma.invoice.findMany();
    console.log(`Processing ${invoices.length} Invoices...`);
    for (const inv of invoices) {
        const fixedName = fixMojibake(inv.customerName || '');
        const fixedSubject = fixMojibake(inv.headerSubject || '');
        const normalizedName = normalizeForSearch(fixedName);

        if (fixedName !== inv.customerName || fixedSubject !== inv.headerSubject || normalizedName !== (inv as any).normalizedCustomerName) {
            await prisma.invoice.update({
                where: { id: inv.id },
                data: {
                    customerName: fixedName,
                    headerSubject: fixedSubject,
                    normalizedCustomerName: normalizedName
                } as any
            });
        }
    }

    // 3. Customer
    const customers = await prisma.customer.findMany();
    console.log(`Processing ${customers.length} Customers...`);
    for (const c of customers) {
        const fixed = fixMojibake(c.name);
        const normalized = normalizeForSearch(fixed);
        if (fixed !== c.name || normalized !== (c as any).normalizedName) {
            await prisma.customer.update({
                where: { id: c.id },
                data: {
                    name: fixed,
                    normalizedName: normalized
                } as any
            });
        }
    }

    console.log('Deep Repair Job Completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
