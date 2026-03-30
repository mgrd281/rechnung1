import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Attempts to repair UTF-8 strings that were misinterpreted as ISO-8859-1 (Latin1)
 */
function repairMojibake(str: string): string {
    if (!str) return str;

    // Check if string contains common mojibake patterns
    // Pattern 1: Ã followed by a byte that would form a valid German character in UTF-8
    // Pattern 2: â combined with other bytes
    if (str.includes('Ã') || str.includes('â') || str.includes('©') || str.includes('®')) {
        try {
            // Logic: Convert current string to Buffer using Latin1 (standard ISO-8859-1)
            // then decode it as UTF-8.
            const buf = Buffer.from(str, 'latin1');
            const decoded = buf.toString('utf8');

            // Verification: if decoded string has fewer special characters or looks "cleaner", keep it.
            // But we must be careful not to corrupt already valid UTF-8.
            // A simple check: if the decoded string contains the replacement character , it failed.
            if (!decoded.includes('')) {
                return decoded;
            }
        } catch (e) {
            // Fallback to original if decoding fails
        }
    }

    return str;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log('Starting Mojibake Repair Job...');

        // 1. Repair InvoiceItems
        const items = await prisma.invoiceItem.findMany({
            where: {
                OR: [
                    { description: { contains: 'Ã' } },
                    { description: { contains: 'â' } },
                ]
            }
        });

        console.log(`Found ${items.length} suspicious InvoiceItems`);
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

        // 2. Repair Invoices (customer fallback names, subjects, etc.)
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

        console.log(`Found ${invoices.length} suspicious Invoices`);
        let fixedInvoices = 0;

        for (const inv of invoices) {
            let updateData: any = {};

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

        return NextResponse.json({
            success: true,
            summary: {
                invoiceItemsFixed: fixedItems,
                invoicesFixed: fixedInvoices
            }
        });

    } catch (error: any) {
        console.error('Mojibake Repair Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
