import { NextRequest, NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { handleOrderCreate } from '@/lib/shopify-order-handler'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, orderNumber, shopDomain } = await req.json()

        if (!orderId && !orderNumber) {
            return NextResponse.json({ error: 'Order ID or Number required' }, { status: 400 })
        }

        const api = new ShopifyAPI(shopDomain)
        let shopifyOrder: any

        if (orderId) {
            shopifyOrder = await api.getOrder(orderId)
        } else {
            // Find by number
            const orders = await api.getOrders({ name: orderNumber, limit: 1 })
            shopifyOrder = orders[0]
        }

        if (!shopifyOrder) {
            return NextResponse.json({ error: 'Order not found in Shopify' }, { status: 404 })
        }

        // Process the order (Update DB, Send keys if needed)
        const result = await handleOrderCreate(shopifyOrder, shopDomain, true)

        return NextResponse.json({
            success: true,
            message: `Order ${shopifyOrder.name} sync successful`,
            invoiceNumber: result.number,
            status: result.status
        })

    } catch (error: any) {
        console.error('Sync Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Server Error'
        }, { status: 500 })
    }
}
