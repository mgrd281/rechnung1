export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify-api';
import { getShopifySettings } from '@/lib/shopify-settings';
import { handleOrderCreate } from '@/lib/shopify-order-handler';

/**
 * MANUAL SYNC ENDPOINT - NO AUTH REQUIRED
 * 
 * This endpoint allows triggering a manual sync of recent Shopify orders
 * without requiring authentication. It's intended for debugging webhook issues.
 * 
 * GET: Sync recent orders and return results
 * POST: Sync a specific order by number
 */

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const settings = getShopifySettings();

        if (!settings.shopDomain || !settings.accessToken) {
            return NextResponse.json({
                error: 'Shopify not configured',
                missing: !settings.shopDomain ? 'SHOPIFY_SHOP_DOMAIN' : 'SHOPIFY_ACCESS_TOKEN'
            }, { status: 500 });
        }

        console.log('🔄 Manual sync triggered...');

        const api = new ShopifyAPI(settings);

        // Fetch recent orders (last 7 days)
        const orders = await api.getOrders({
            limit: 20,
            status: 'any',
            created_at_min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        console.log(`📦 Found ${orders.length} orders in Shopify`);

        const results = {
            found: orders.length,
            processed: 0,
            skipped: 0,
            errors: 0,
            details: [] as any[]
        };

        for (const order of orders) {
            try {
                // Check if invoice exists
                const existing = await prisma.invoice.findFirst({
                    where: { shopifyOrderId: String(order.id) }
                });

                if (existing && existing.status === 'PAID') {
                    results.skipped++;
                    results.details.push({
                        order: order.name,
                        status: 'skipped',
                        reason: 'Already exists and paid'
                    });
                    continue;
                }

                console.log(`🔄 Processing: ${order.name}`);

                const invoice = await handleOrderCreate(order, settings.shopDomain, true);

                results.processed++;
                results.details.push({
                    order: order.name,
                    status: 'processed',
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.number,
                    invoiceStatus: invoice.status
                });

            } catch (err: any) {
                results.errors++;
                results.details.push({
                    order: order.name,
                    status: 'error',
                    error: err.message
                });
            }
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            durationMs: duration,
            ...results
        });

    } catch (error: any) {
        console.error('Manual sync error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { orderNumber, sendEmail = true } = await request.json();

        if (!orderNumber) {
            return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 });
        }

        const settings = getShopifySettings();
        const api = new ShopifyAPI(settings);

        // Search for order
        const searchName = orderNumber.toString().startsWith('#') ? orderNumber : `#${orderNumber}`;
        const orders = await api.getOrders({ name: searchName, status: 'any' });

        if (orders.length === 0) {
            return NextResponse.json({
                error: `Order ${searchName} not found in Shopify`
            }, { status: 404 });
        }

        const order = orders[0];
        console.log(`📦 Processing single order: ${order.name}`);

        const result = await handleOrderCreate(order, settings.shopDomain, sendEmail);

        return NextResponse.json({
            success: true,
            order: order.name,
            invoice: {
                id: result.id,
                number: result.number,
                status: result.status,
                total: result.total
            },
            emailTriggered: sendEmail
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
