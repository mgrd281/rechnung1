export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { ShopifyAPI } from '@/lib/shopify-api';
import { getShopifySettings } from '@/lib/shopify-settings';
import { handleOrderCreate } from '@/lib/shopify-order-handler';

export async function GET() {
    try {
        const settings = getShopifySettings();
        const api = new ShopifyAPI(settings);

        // Fetch last 50 orders
        const orders = await api.getOrders({ limit: 50, status: 'any' });

        const results = [];
        for (const order of orders) {
            try {
                const res = await handleOrderCreate(order, settings.shopDomain, true);
                results.push({ order: order.name, status: 'success', invoice: res.number });
            } catch (e: any) {
                results.push({ order: order.name, status: 'error', message: e.message });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
