import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to check webhook configuration and recent orders
 * GET /api/shopify/webhooks/debug
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Check environment variables
        const envCheck = {
            SHOPIFY_WEBHOOK_SECRET: !!process.env.SHOPIFY_WEBHOOK_SECRET,
            SHOPIFY_API_SECRET: !!process.env.SHOPIFY_API_SECRET,
            SHOPIFY_ACCESS_TOKEN: !!process.env.SHOPIFY_ACCESS_TOKEN,
            SHOPIFY_SHOP_DOMAIN: process.env.SHOPIFY_SHOP_DOMAIN || 'NOT SET',
            SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || 'NOT SET',
        };

        // 2. Check database connection
        let dbStatus = 'Unknown';
        let recentInvoices: any[] = [];
        let recentOrders: any[] = [];

        try {
            const invoiceCount = await prisma.invoice.count();
            const orderCount = await prisma.order.count();

            recentInvoices = await prisma.invoice.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    invoiceNumber: true,
                    status: true,
                    createdAt: true,
                    customerEmail: true,
                    shopifyOrderId: true,
                }
            });

            recentOrders = await prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    createdAt: true,
                    shopifyOrderId: true,
                }
            });

            dbStatus = `Connected (${invoiceCount} invoices, ${orderCount} orders)`;
        } catch (dbError: any) {
            dbStatus = `Error: ${dbError.message}`;
        }

        // 3. Check organization
        let orgStatus = 'Unknown';
        try {
            const org = await prisma.organization.findFirst();
            orgStatus = org ? `Found: ${org.name}` : 'No organization found!';
        } catch (e) {
            orgStatus = 'Error checking organization';
        }

        // 4. Check Shopify connection
        let shopifyStatus = 'Unknown';
        try {
            const conn = await prisma.shopifyConnection.findFirst({
                include: { organization: true }
            });
            shopifyStatus = conn
                ? `Connected: ${conn.shopName} → ${conn.organization.name}`
                : 'No Shopify connection found!';
        } catch (e) {
            shopifyStatus = 'Error checking Shopify connection';
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: envCheck,
            database: dbStatus,
            organization: orgStatus,
            shopifyConnection: shopifyStatus,
            recentInvoices: recentInvoices.map(i => ({
                number: i.invoiceNumber,
                status: i.status,
                created: i.createdAt,
                email: i.customerEmail,
                shopifyId: i.shopifyOrderId
            })),
            recentOrders: recentOrders.map(o => ({
                number: o.orderNumber,
                status: o.status,
                created: o.createdAt,
                shopifyId: o.shopifyOrderId
            })),
            webhookEndpoint: '/api/shopify/webhooks',
            expectedTopics: ['orders/create', 'orders/paid', 'orders/updated']
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
