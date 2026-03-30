import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        console.log('⏰ Cron: Checking for overdue unpaid orders...')

        const shopify = new ShopifyAPI()

        // Calculate cutoff date (14 days ago)
        const daysAgo = 14
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

        // Fetch pending orders older than 14 days
        // status: 'open' means not archived/cancelled
        // financial_status: 'pending' means unpaid
        const orders = await shopify.getOrders({
            status: 'open',
            financial_status: 'pending',
            created_at_max: cutoffDate.toISOString()
        })

        console.log(`Found ${orders.length} pending orders older than ${daysAgo} days.`)

        const cancelledOrders = []
        const skippedOrders = []
        const errors = []

        for (const order of orders) {
            // Check payment method
            // payment_gateway_names is usually available in the order object
            const gateways = (order as any).payment_gateway_names || []
            const gatewayStr = gateways.join(' ').toLowerCase()

            // Define target payment methods (Vorkasse, Rechnung, Manual)
            const isTargetMethod =
                gatewayStr.includes('vorkasse') ||
                gatewayStr.includes('rechnung') ||
                gatewayStr.includes('manual') ||
                gatewayStr.includes('bank') ||
                gatewayStr.includes('transfer') ||
                gatewayStr.includes('invoice') ||
                gatewayStr === '' // Sometimes manual orders have empty gateway names?

            if (isTargetMethod) {
                console.log(`🚫 Cancelling overdue order ${order.name} (${order.id}) - Gateway: ${gatewayStr}`)

                try {
                    // 1. Cancel in Shopify
                    await shopify.cancelOrder(order.id)

                    // 2. Update local DB if exists
                    // Find order by shopify ID
                    const dbOrder = await prisma.order.findFirst({
                        where: { shopifyOrderId: String(order.id) }
                    })

                    if (dbOrder) {
                        // Update order status
                        await prisma.order.update({
                            where: { id: dbOrder.id },
                            data: { status: 'CANCELLED' }
                        })

                        // Update associated invoices
                        await prisma.invoice.updateMany({
                            where: { orderId: dbOrder.id },
                            data: { status: 'CANCELLED' }
                        })
                        console.log(`✅ Updated local order/invoices for ${order.name}`)
                    }

                    cancelledOrders.push({
                        id: order.id,
                        name: order.name,
                        gateway: gatewayStr,
                        date: order.created_at
                    })
                } catch (err) {
                    console.error(`❌ Failed to cancel order ${order.name}:`, err)
                    errors.push({
                        id: order.id,
                        name: order.name,
                        error: (err as Error).message
                    })
                }
            } else {
                console.log(`⏭️ Skipping order ${order.name} - Gateway '${gatewayStr}' not in target list.`)
                skippedOrders.push({
                    id: order.id,
                    name: order.name,
                    gateway: gatewayStr
                })
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                processed: orders.length,
                cancelled: cancelledOrders.length,
                skipped: skippedOrders.length,
                errors: errors.length
            },
            cancelledOrders,
            skippedOrders,
            errors
        })

    } catch (error) {
        console.error('Error in cancel-overdue-orders cron:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
