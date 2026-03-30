
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
// Also try standard .env just in case (dotenv won't override if already set)
dotenv.config();
// Adjust path for imports if running from root
import { ShopifyAPI } from '../lib/shopify-api';

async function main() {
    console.log('Starting cancellation script...');

    if (!process.env.SHOPIFY_ACCESS_TOKEN || !process.env.SHOPIFY_SHOP_DOMAIN) {
        console.error('Missing env vars! Ensure .env is present or vars are exported.');
        // Try to load from local file as fallback if env vars missing (logic in settings)
    }

    const shopify = new ShopifyAPI();

    // Test connection
    const conn = await shopify.testConnection();
    if (!conn.success) {
        console.error('Connection failed:', conn.message);
        process.exit(1);
    }
    console.log('Connected to:', conn.shop?.name);

    // Criteria
    const queries = [
        'Mgrdegh@gmx.de',
        'mgrdegh@web.de',
        'Mgrdegh Ghazarian',
        'mgr' // Include 'mgr' as requested in first prompt, might match 'Mgrdegh'
    ];

    let ordersToProcess = new Map<number, any>();

    for (const q of queries) {
        console.log(`Searching for: ${q}`);
        const searchParams = new URLSearchParams();
        searchParams.set('query', q);
        searchParams.set('status', 'any');
        searchParams.set('limit', '50');

        try {
            // @ts-ignore
            const res = await shopify.makeRequest(`/orders/search.json?${searchParams}`);
            const data = await res.json();
            const orders = data.orders || [];
            console.log(`Found ${orders.length} matches for "${q}"`);

            for (const order of orders) {
                ordersToProcess.set(order.id, order);
            }
        } catch (e: any) {
            console.error(`Error searching ${q}:`, e.message);
        }
    }

    console.log(`\nTotal unique orders to check: ${ordersToProcess.size}`);

    for (const order of ordersToProcess.values()) {
        // Double check to be safe
        const email = (order.email || '').toLowerCase();
        const custEmail = (order.customer?.email || '').toLowerCase();
        const name = ((order.customer?.first_name || '') + ' ' + (order.customer?.last_name || '')).toLowerCase();
        const billingName = (order.billing_address?.name || '').toLowerCase();

        const isMatch =
            email === 'mgrdegh@gmx.de' ||
            custEmail === 'mgrdegh@gmx.de' ||
            email === 'mgrdegh@web.de' ||
            custEmail === 'mgrdegh@web.de' ||
            name.includes('mgrdegh ghazarian') ||
            billingName.includes('mgrdegh ghazarian') ||
            // Strictly check 'mgr' if it was a standalone match request, but user clarified specifics.
            // User said "Mgrdegh Ghazarian or emails... oder mgr". "mgr" might be typo for name.
            // I will trust the strict emails and full name.
            name.includes('mgrdegh');

        if (!isMatch) {
            console.log(`Skipping order #${order.order_number} (ID ${order.id}) - Match weak (${email}, ${name})`);
            continue;
        }

        if (order.cancelled_at) {
            console.log(`Order #${order.order_number} already cancelled.`);
            continue;
        }

        console.log(`Cancelling Order #${order.order_number} (${order.id})...`);
        try {
            await shopify.cancelOrder(order.id);
            console.log('SUCCESS');
        } catch (e: any) {
            console.error('FAILED:', e.message);
        }
    }
}

main().catch(err => console.error(err));
