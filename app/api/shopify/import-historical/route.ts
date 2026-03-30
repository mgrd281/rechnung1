
import { NextResponse } from 'next/server';
import { ShopifyAPI } from '@/lib/shopify-api';
import { handleOrderCreate } from '@/lib/shopify-order-handler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const shop = searchParams.get('shop');

        console.log('🚀 Starting HISTORICAL IMPORT for shop:', shop);

        const api = new ShopifyAPI();

        // Fetch ALL orders (open, closed, cancelled, etc.)
        // The getOrders method in ShopifyAPI already handles pagination and rate limiting
        const orders = await api.getOrders({
            limit: 999999,
            status: 'any',
            financial_status: 'any'
        });

        console.log(`📦 Fetched ${orders.length} total orders from Shopify.`);

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errors = [];

        // Get the organization ID first
        const organization = await prisma.organization.findFirst();
        if (!organization) {
            throw new Error('Organization not found');
        }

        // Process in batches to avoid overwhelming the DB but speed up execution
        const BATCH_SIZE = 10;
        for (let i = 0; i < orders.length; i += BATCH_SIZE) {
            const batch = orders.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (order) => {
                try {
                    const result = await handleOrderCreate(order, shop || process.env.SHOPIFY_SHOP_DOMAIN || null);
                    if (result) createdCount++;
                    else skippedCount++;
                } catch (err: any) {
                    console.error(`❌ Failed to import order ${order.name}:`, err);
                    errors.push({ order: order.name, error: err.message });
                }
            }));
            // Minimal delay between batches to allow GC and prevent complete resource exhaustion
            await new Promise(r => setTimeout(r, 10));
        }

        console.log(`✅ Historical import finished. Processed: ${createdCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

        return NextResponse.json({
            success: true,
            message: `Import completed. Fetched ${orders.length} orders. Processed ${createdCount}.`,
            stats: {
                total: orders.length,
                processed: createdCount,
                skipped: skippedCount,
                errors: errors.length
            }
        });

    } catch (error: any) {
        console.error('❌ Critical error in historical import:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
