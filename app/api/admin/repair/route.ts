
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function fixMojibake(text: string): string {
    if (!text) return text;

    let fixed = text;

    // 0. Nuclear clean: Remove Control Characters and Null Bytes (the main cause of boxes in Excel/Web)
    fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // 1. Try automatic healing for "double encoded" UTF-8 (the Ã¤ -> ä problem)
    try {
        // Only attempt if it looks like UTF-8 bytes interpreted as Latin-1
        if (fixed.includes('Ã') || fixed.includes('â')) {
            const healed = decodeURIComponent(escape(fixed));
            if (healed && healed !== fixed) {
                fixed = healed;
            }
        }
    } catch (e) {
        // Fallback to manual
    }

    // 2. Manual mappings for persistent artifacts
    for (let i = 0; i < 2; i++) {
        const mappings: [RegExp, string][] = [
            [/â€“/g, '–'], [/â€”/g, '—'], [/â€™/g, '’'], [/â€/g, '\"'],
            [/Ã¤/g, 'ä'], [/Ã¶/g, 'ö'], [/Ã¼/g, 'ü'], [/Ã„/g, 'Ä'], [/Ã–/g, 'Ö'], [/Ãœ/g, 'Ü'], [/ÃŸ/g, 'ß'],
            [/â„¢/g, '™'], [/â€¦/g, '…'], [/Â/g, ''], [/â\|\|/g, '|'], [/â/g, ''],
            [/\uFFFD/g, ''], // Nuclear: Remove the replacement character itself
            [/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''] // More aggressive control chars
        ];

        let changed = false;
        for (const [pattern, replacement] of mappings) {
            const next = fixed.replace(pattern, replacement);
            if (next !== fixed) {
                fixed = next;
                changed = true;
            }
        }
        if (!changed) break;
    }

    // Final purge of any remaining "boxes" at the byte level
    return fixed.replace(/[^\x20-\x7E\xA0-\xFF\u20AC\u2013\u2014\u2019\u201C\u201D\u2026\u2122\u00A0-\u017F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeForSearch(text: string): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[-_|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function GET(request: NextRequest) {
    try {
        // const session = await auth();
        // Temporarily disabled for emergency repair
        /*
        if (!session) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        */

        const { searchParams } = new URL(request.url);
        const dryRun = searchParams.get('dryRun') !== 'false';
        const fixAll = searchParams.get('fixAll') === 'true'; // New option to force normalize all rows

        let report: any = {
            itemsProcessed: 0,
            itemsFixed: 0,
            invoicesProcessed: 0,
            invoicesFixed: 0,
            customersProcessed: 0,
            customersFixed: 0,
            dryRun
        };

        // 1. Fix InvoiceItems
        const items = fixAll ? await prisma.invoiceItem.findMany() : await prisma.invoiceItem.findMany({
            where: {
                OR: [
                    { description: { contains: 'Ã' } },
                    { description: { contains: 'â' } },
                    { normalizedDescription: null }
                ]
            }
        });

        for (const item of items) {
            report.itemsProcessed++;
            const fixed = fixMojibake(item.description);
            const normalized = normalizeForSearch(fixed);

            if (fixed !== item.description || normalized !== item.normalizedDescription) {
                if (!dryRun) {
                    await prisma.invoiceItem.update({
                        where: { id: item.id },
                        data: {
                            description: fixed,
                            normalizedDescription: normalized
                        }
                    });
                }
                report.itemsFixed++;
            }
        }

        // 2. Fix Invoices
        const invoices = fixAll ? await prisma.invoice.findMany() : await prisma.invoice.findMany({
            where: {
                OR: [
                    { customerName: { contains: 'Ã' } },
                    { customerName: { contains: 'â' } },
                    { normalizedCustomerName: null }
                ]
            }
        });

        for (const inv of invoices) {
            report.invoicesProcessed++;
            const fixedName = fixMojibake(inv.customerName || '');
            const fixedSubject = fixMojibake(inv.headerSubject || '');
            const normalizedName = normalizeForSearch(fixedName);

            if (fixedName !== inv.customerName || fixedSubject !== inv.headerSubject || normalizedName !== inv.normalizedCustomerName) {
                if (!dryRun) {
                    await prisma.invoice.update({
                        where: { id: inv.id },
                        data: {
                            customerName: fixedName,
                            headerSubject: fixedSubject,
                            normalizedCustomerName: normalizedName
                        }
                    });
                }
                report.invoicesFixed++;
            }
        }

        // 3. Fix Customers
        const customers = fixAll ? await prisma.customer.findMany() : await prisma.customer.findMany({
            where: {
                OR: [
                    { name: { contains: 'Ã' } },
                    { name: { contains: 'â' } },
                    { normalizedName: null }
                ]
            }
        });

        for (const c of customers) {
            report.customersProcessed++;
            const fixed = fixMojibake(c.name);
            const normalized = normalizeForSearch(fixed);

            if (fixed !== c.name || normalized !== c.normalizedName) {
                if (!dryRun) {
                    await prisma.customer.update({
                        where: { id: c.id },
                        data: {
                            name: fixed,
                            normalizedName: normalized
                        }
                    });
                }
                report.customersFixed++;
            }
        }

        return NextResponse.json({
            success: true,
            message: dryRun ? 'Dry run completed. No data was changed.' : 'Database repair and normalization completed.',
            report
        });

    } catch (error: any) {
        console.error('Repair failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
