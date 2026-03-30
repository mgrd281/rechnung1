import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";
import { subDays, startOfToday } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '7d';

        // 1. Determine Organization
        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
            select: { organizationId: true }
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 404 });
        }

        const orgId = user.organizationId;

        // 2. Determine Date Filter
        let startDate = subDays(new Date(), 7);
        if (range === 'today') startDate = startOfToday();
        else if (range === '30d') startDate = subDays(new Date(), 30);
        else if (range === 'all') startDate = new Date(0);

        // 3. Fetch active AbandonedCarts in the range
        // We use AbandonedCart.updatedAt and lineItems to get THE CURRENT state
        const activeCarts = await prisma.abandonedCart.findMany({
            where: {
                organizationId: orgId,
                updatedAt: { gte: startDate },
                isRecovered: false // Generally only show non-recovered for "Abandoned" stats
            },
            select: {
                lineItems: true,
                totalPrice: true
            }
        });

        // 4. Aggregate Current Stats
        let totalItemsInCarts = 0;
        const uniqueProductsGlobal = new Set<string>();
        const productStats: Record<string, {
            title: string;
            image: string;
            count: number;
            productId: string;
        }> = {};

        activeCarts.forEach(cart => {
            const items = Array.isArray(cart.lineItems) ? cart.lineItems : [];

            items.forEach((item: any) => {
                const productId = (item.product_id || item.id || 'unknown').toString();
                const qty = parseInt(item.quantity || item.qty || 1);
                const title = item.title || 'Produkt';
                const image = item.image?.src || (typeof item.image === 'string' ? item.image : '');

                totalItemsInCarts += qty;
                uniqueProductsGlobal.add(productId);

                if (!productStats[productId]) {
                    productStats[productId] = {
                        productId,
                        title,
                        image,
                        count: 0
                    };
                }
                productStats[productId].count += qty;
            });
        });

        // 5. Format Top Products (Sorted by current occupancy)
        const topProductsItems = Object.values(productStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        return NextResponse.json({
            stats: {
                totalItemsAdded: totalItemsInCarts, // "Hinzugefügte Artikel" represents current state now
                uniqueProductsCount: uniqueProductsGlobal.size,
                topProducts: topProductsItems
            }
        });

    } catch (error: any) {
        console.error('[Cart Stats API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
