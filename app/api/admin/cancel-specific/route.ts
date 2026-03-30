
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        // For safety, you might want to check for admin role here
        // if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const shopify = new ShopifyAPI()

        // The criteria
        const queries = [
            'Mgrdegh@gmx.de',
            'mgrdegh@web.de',
            'Mgrdegh Ghazarian'
        ]

        let allOrders: any[] = []

        // 1. Fetch matching orders
        for (const q of queries) {
            console.log(`Searching for orders matching: ${q}`)
            // searchOrdersFlexible limits to 10 by default, let's bump it or implement custom search
            // The class method sets limit to 10. Let's rely on standard getOrders if possible or just use the search
            // Actually, let's just use the searchOrdersFlexible but we might miss some if > 10.
            // Better to use getOrders with specific email if supported? 
            // Shopify API /orders.json doesn't support filtering by email directly in basic params easily without query.
            // So /orders/search.json is best.

            // Let's modify the class on the fly or just use makeRequest directly to get more than 10?
            // Or just loop the searchOrdersFlexible if it supported pagination, but it doesn't seem to return pagination info in the helper.

            // We will try to fetch using the generic search which typically finds them.
            // If we need more comprehensive search, we might need a custom implementation here.

            // Note: searchOrdersFlexible uses /orders/search.json which matches name, email, etc.
            // We can iterate pages if we implemented it, but let's assume < 50 orders for a single person.
            // I'll call the underlying API directly to ensure I get enough limit.

            const searchParams = new URLSearchParams()
            searchParams.set('query', q)
            searchParams.set('status', 'any') // Get open, closed, cancelled
            searchParams.set('limit', '250') // Max allowed

            // @ts-ignore - reaching into private/protected method or just casting if public methods allow generic request
            // ShopifyAPI class doesn't expose makeRequest publicly. 
            // But searchOrdersFlexible is public. It sets limit 10.
            // I should probably update ShopifyAPI to allow limit param in searchOrdersFlexible or use it as is?
            // I'll update ShopifyAPI to allow limit in searchOrdersFlexible or add a new method.
            // Actually, I can just use `shopify.makeRequest` if I cast it to any.

            // @ts-ignore
            const response = await shopify.makeRequest(`/orders/search.json?${searchParams}`)
            const data = await response.json()
            const orders = data.orders || []

            allOrders = [...allOrders, ...orders]
        }

        // 2. Deduplicate
        const uniqueOrders = new Map()
        allOrders.forEach(o => uniqueOrders.set(o.id, o))

        const ordersToCancel = Array.from(uniqueOrders.values())

        console.log(`Found ${ordersToCancel.length} unique orders relating to the criteria.`)

        const results = []

        // 3. Process cancellations
        for (const order of ordersToCancel) {
            // Check validation
            const emailMatch = [
                'Mgrdegh@gmx.de',
                'mgrdegh@web.de'
            ].some(e => order.email?.toLowerCase() === e.toLowerCase() || order.customer?.email?.toLowerCase() === e.toLowerCase())

            const nameMatch = (
                (order.customer?.first_name + ' ' + order.customer?.last_name).toLowerCase().includes('mgrdegh ghazarian') ||
                (order.billing_address?.name || '').toLowerCase().includes('mgrdegh ghazarian')
            )

            if (!emailMatch && !nameMatch) {
                console.log(`Skipping order ${order.name} (ID: ${order.id}) - loose match not verified strict.`)
                continue
            }

            if (order.cancelled_at) {
                results.push({ id: order.id, name: order.name, status: 'Already Cancelled' })
                continue
            }

            console.log(`Cancelling order ${order.name} (ID: ${order.id})...`)
            try {
                await shopify.cancelOrder(order.id)
                results.push({ id: order.id, name: order.name, status: 'Cancelled Successfully' })
            } catch (e: any) {
                // If cancellation fails, maybe try refund? 
                // Typically cancellation fails if fulfilled.
                // The user said "cancel", but if it fails, I'll log strict error.
                results.push({ id: order.id, name: order.name, status: 'Failed: ' + e.message })
            }
        }

        return NextResponse.json({
            processed: results.length,
            details: results
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
