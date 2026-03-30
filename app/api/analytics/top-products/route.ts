export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOrganization } from '@/lib/db-operations';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { organizationId: true }
        });

        let organizationId = user?.organizationId;

        if (!organizationId) {
            let org = await prisma.organization.findFirst({
                where: { id: 'default-org' }
            });

            if (!org) {
                org = await ensureOrganization();
            }
            organizationId = org.id;
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Get all invoices for the organization
        const invoices = await prisma.invoice.findMany({
            where: {
                organizationId: organizationId,
                status: { in: ['PAID', 'SENT', 'BEZAHLT', 'OFFEN', 'REFUNDED', 'GUTSCHRIFT'] as any }
            },
            select: {
                items: true,
                totalGross: true,
                status: true,
                documentKind: true,
                createdAt: true
            }
        });

        // Calculate product statistics
        const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
        const normalizeStatus = (s: string) => s?.toUpperCase().trim() || '';

        invoices.forEach((invoice: any) => {
            const s = normalizeStatus(invoice.status as any);
            // Strictly exclude cancelled and voided
            if (s === 'CANCELLED' || s === 'STORNIERT' || s === 'VOIDED') return;

            const sUpper = s.toUpperCase();
            const isRefundDoc = invoice.documentKind === 'CREDIT_NOTE' ||
                invoice.documentKind === 'REFUND_FULL' ||
                invoice.documentKind === 'REFUND_PARTIAL' ||
                sUpper === 'GUTSCHRIFT';

            // For normal invoices, only count if PAID
            if (!isRefundDoc && !(sUpper === 'PAID' || sUpper === 'BEZAHLT')) return;

            if (invoice.items && Array.isArray(invoice.items)) {
                invoice.items.forEach((item: any) => {
                    const productName = item.description || item.name || 'Unbekanntes Produkt';
                    const quantity = Number(item.quantity) || 1;
                    const price = Number(item.unitPrice || item.price || 0);

                    // If it's a refund document, items are negative revenue
                    let revenue = quantity * price;
                    let finalQuantity = quantity;

                    if (isRefundDoc) {
                        revenue = -Math.abs(revenue);
                        finalQuantity = -Math.abs(quantity);
                    }

                    if (!productStats[productName]) {
                        productStats[productName] = {
                            name: productName,
                            quantity: 0,
                            revenue: 0
                        };
                    }

                    productStats[productName].quantity += finalQuantity;
                    productStats[productName].revenue += revenue;
                });
            }
        });

        // Convert to array and sort by quantity
        const topProducts = Object.values(productStats)
            .map(p => ({
                ...p,
                name: p.name
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '')
                    .replace(/[^\x20-\x7E\xA0-\xFF\u20AC\u2013\u2014\u2019\u201C\u201D\u2026\u2122\u00A0-\u017F]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            topProducts
        });

    } catch (error: any) {
        console.error('Error fetching top products:', error);
        return NextResponse.json(
            { error: `Failed to fetch top products: ${error.message}` },
            { status: 500 }
        );
    }
}
