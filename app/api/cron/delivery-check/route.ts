import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { resendDigitalProductEmail } from '@/lib/digital-products'

// Avoid caching to ensure fresh results every minute
export const dynamic = 'force-dynamic'

/**
 * CRON JOB: Delivery Check
 * Checks for "PENDING" license key deliveries that should be sent.
 * 
 * Logic:
 * 1. Find keys with deliveryStatus = 'PENDING'
 * 2. Check their Shopify Order status
 * 3. If Order is PAID, send the email and mark as SENT
 */
export async function GET(req: Request) {
    try {
        // 1. Fetch pending keys (Limit to 20 to safeguard API limits/timeouts)
        const pendingKeys = await prisma.licenseKey.findMany({
            where: {
                deliveryStatus: 'PENDING',
                emailSent: false,
                shopifyOrderId: { not: null }
            },
            take: 20
        })

        if (pendingKeys.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending deliveries found',
                processed: 0
            })
        }

        const api = new ShopifyAPI()
        const results: any[] = []

        // Group keys by order to minimize API calls
        const ordersMap = new Map<string, typeof pendingKeys>()
        for (const key of pendingKeys) {
            if (!key.shopifyOrderId) continue
            const existing = ordersMap.get(key.shopifyOrderId) || []
            existing.push(key)
            ordersMap.set(key.shopifyOrderId, existing)
        }

        console.log(`⏱️ Checks: Found ${pendingKeys.length} pending keys across ${ordersMap.size} orders.`)

        // 2. Process each order
        for (const [shopifyOrderId, keys] of ordersMap.entries()) {
            try {
                const orderId = shopifyOrderId.replace(/\D/g, '') // Ensure numeric ID
                const order = await api.getOrder(Number(orderId))

                if (order && order.financial_status === 'paid') {
                    console.log(`💰 Verified Order ${shopifyOrderId} is PAID. Triggering delivery...`)

                    for (const key of keys) {
                        try {
                            // Using resendDigitalProductEmail as it contains the logic to:
                            // - Find customer (even via Order fallback)
                            // - Generate email
                            // - Send email
                            // - Update deliveryStatus to SENT
                            await resendDigitalProductEmail(key.id)
                            results.push({ keyId: key.id, order: shopifyOrderId, status: 'DELIVERED' })
                        } catch (err) {
                            console.error(`❌ Failed to deliver key ${key.id}:`, err)
                            results.push({ keyId: key.id, order: shopifyOrderId, status: 'ERROR', error: String(err) })
                        }
                    }
                } else {
                    // Still pending or other status
                    const status = order ? order.financial_status : 'not_found'
                    console.log(`⏳ Order ${shopifyOrderId} status is '${status}'. Skipping delivery.`)
                    results.push({ order: shopifyOrderId, status: 'SKIPPED', reason: `Status: ${status}` })
                }

            } catch (err) {
                console.error(`Error processing order ${shopifyOrderId}:`, err)
                results.push({ order: shopifyOrderId, status: 'API_ERROR', error: String(err) })
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            details: results
        })

    } catch (error) {
        console.error('❌ Delivery Check Cron Failed:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 })
    }
}
