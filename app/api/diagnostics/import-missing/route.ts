export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { ShopifyAPI } from '@/lib/shopify-api';
import { handleOrderCreate } from '@/lib/shopify-order-handler';

export async function POST(request: NextRequest) {
    try {
        const { invoiceNumbers } = await request.json();

        if (!Array.isArray(invoiceNumbers) || invoiceNumbers.length === 0) {
            return NextResponse.json({ error: 'Invalid invoice numbers' }, { status: 400 });
        }

        const shopify = new ShopifyAPI();
        const results = {
            success: [] as string[],
            failed: [] as string[],
            notFound: [] as string[]
        };

        // Process each invoice number
        for (const num of invoiceNumbers) {
            try {
                // Search for order by name (e.g. "#1001")
                // Try both with and without '#' prefix just in case
                const orderName = num.toString().startsWith('#') ? num : `#${num}`;

                console.log(`Searching for missing order: ${orderName}`);

                const orders = await shopify.getOrders({
                    name: orderName,
                    status: 'any' // Search all orders regardless of status
                });

                if (orders.length === 0) {
                    console.log(`Order ${orderName} not found in Shopify`);
                    results.notFound.push(orderName);
                    continue;
                }

                // We found the order!
                const order = orders[0]; // Should be the correct one
                console.log(`Found order ${order.id} for ${orderName}, importing...`);

                // Process the order to create invoice
                // We need to pass the shop domain. Since we are using the default settings, we can get it from there.
                const settings = shopify['settings']; // Access private settings property or use getShopifySettings
                await handleOrderCreate(order, settings.shopDomain);

                results.success.push(orderName);

            } catch (err: any) {
                console.error(`Error importing order ${num}:`, err);
                results.failed.push(`${num} (${err.message})`);
            }
        }

        return NextResponse.json({
            message: 'Import process completed',
            results
        });

    } catch (error: any) {
        console.error('Import missing invoices error:', error);
        return NextResponse.json(
            { error: 'Failed to import missing invoices' },
            { status: 500 }
        );
    }
}
