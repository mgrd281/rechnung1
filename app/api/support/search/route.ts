
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const query = searchParams.get('query')

        if (!query) {
            return NextResponse.json({ error: 'Query required' }, { status: 400 })
        }

        // Search in Orders (by Order Number or Shopify Order ID)
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { orderNumber: { contains: query, mode: 'insensitive' } },
                    { shopifyOrderId: { contains: query, mode: 'insensitive' } },
                    { customer: { email: { contains: query, mode: 'insensitive' } } },
                    { customer: { name: { contains: query, mode: 'insensitive' } } }
                ]
            },
            include: {
                customer: true
            },
            take: 5
        })

        // Search in License Keys (by Key or Shopify Order ID)
        const keys = await prisma.licenseKey.findMany({
            where: {
                OR: [
                    { key: { contains: query, mode: 'insensitive' } },
                    { shopifyOrderId: { contains: query, mode: 'insensitive' } }
                ]
            },
            include: {
                digitalProduct: true
            },
            take: 5
        })

        // Combine results
        // We want to return a list of "Customer Contexts"
        // If we found an order, we can look for keys associated with it.
        // If we found a key, we can look for the order associated with it.

        const results = []

        // Process Orders
        for (const order of orders) {
            // Find keys for this order
            const orderKeys = await prisma.licenseKey.findMany({
                where: { shopifyOrderId: order.shopifyOrderId || '' },
                include: { digitalProduct: true }
            })

            results.push({
                type: 'order',
                order: order,
                keys: orderKeys,
                customer: order.customer
            })
        }

        // Process Keys (if not already found via order)
        for (const key of keys) {
            const existingResult = results.find(r => r.order?.shopifyOrderId === key.shopifyOrderId)
            if (!existingResult) {
                // Try to find order if possible
                let order = null
                if (key.shopifyOrderId) {
                    order = await prisma.order.findFirst({
                        where: { shopifyOrderId: key.shopifyOrderId },
                        include: { customer: true }
                    })
                }

                results.push({
                    type: 'key',
                    key: key,
                    order: order,
                    customer: order?.customer
                })
            }
        }

        // 3. Search in Shopify (Real-time fallback)
        const { getShopifySettings } = await import('@/lib/shopify-settings')
        const settings = getShopifySettings()

        if (settings.enabled && settings.accessToken && settings.shopDomain) {
            try {
                let shopifyOrders = []
                const headers = {
                    'X-Shopify-Access-Token': settings.accessToken,
                    'Content-Type': 'application/json'
                }

                // Determine search strategy
                if (query.includes('@')) {
                    // Search by email
                    const res = await fetch(`https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders.json?status=any&email=${encodeURIComponent(query)}&fields=id,name,email,created_at,customer`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        shopifyOrders = data.orders || []
                    }
                } else {
                    // Search by name (Order Number)
                    const res = await fetch(`https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders.json?status=any&name=${encodeURIComponent(query)}&fields=id,name,email,created_at,customer`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        shopifyOrders = data.orders || []
                    }
                }

                // Process Shopify Results
                for (const sOrder of shopifyOrders) {
                    const shopifyId = String(sOrder.id)

                    // Check if we already have this order in our results
                    const exists = results.find(r => r.order?.shopifyOrderId === shopifyId)

                    if (!exists) {
                        // Check if we have keys for this Shopify ID even if we don't have the order record
                        const localKeys = await prisma.licenseKey.findMany({
                            where: { shopifyOrderId: shopifyId },
                            include: { digitalProduct: true }
                        })

                        results.push({
                            type: 'shopify_order',
                            order: {
                                orderNumber: sOrder.name,
                                shopifyOrderId: shopifyId,
                                orderDate: new Date(sOrder.created_at),
                                status: 'SHOPIFY_ONLY' // Indicator that this is not in local DB
                            },
                            customer: {
                                name: sOrder.customer ? `${sOrder.customer.first_name || ''} ${sOrder.customer.last_name || ''}`.trim() : 'Shopify Customer',
                                email: sOrder.email || sOrder.customer?.email
                            },
                            keys: localKeys // Might be empty if not processed
                        })
                    }
                }
            } catch (shopifyError) {
                console.error('Shopify search error:', shopifyError)
                // Continue without Shopify results if it fails
            }
        }

        return NextResponse.json({ success: true, data: results })

    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
