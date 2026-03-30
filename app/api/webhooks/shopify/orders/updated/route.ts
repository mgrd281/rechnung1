import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Verification helper
async function verifyWebhook(req: NextRequest, secret: string): Promise<{ valid: boolean; rawBody: string }> {
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
    if (!hmacHeader) return { valid: false, rawBody: '' }

    const rawBody = await req.clone().text()
    const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64')

    try {
        const valid = crypto.timingSafeEqual(
            Buffer.from(hash, 'base64'),
            Buffer.from(hmacHeader, 'base64')
        )
        return { valid, rawBody }
    } catch {
        return { valid: false, rawBody }
    }
}

export async function POST(req: NextRequest) {
    const topic = req.headers.get('x-shopify-topic') || 'unknown'
    const shopDomain = req.headers.get('x-shopify-shop-domain')

    console.log(`\n${'='.repeat(60)}`)
    console.log(`🔄 INCOMING WEBHOOK UPDATE: ${topic}`)
    console.log(`   Shop: ${shopDomain}`)
    console.log(`${'='.repeat(60)}`)

    try {
        // 1. Verify HMAC
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET
        let order: any

        if (secret) {
            const { valid, rawBody } = await verifyWebhook(req, secret)
            if (!valid) {
                console.error('❌ HMAC VERIFICATION FAILED')
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            order = JSON.parse(rawBody)
        } else {
            console.warn('⚠️ No SHOPIFY_API_SECRET found, skipping HMAC check')
            order = await req.json()
        }

        console.log(`📦 Order Updated: ${order.name} (Status: ${order.financial_status})`)

        // 2. Process update
        const { handleOrderUpdate } = await import('@/lib/shopify-order-handler')
        const { logWebhookActivity } = await import('@/lib/webhook-logger')

        try {
            const result = await handleOrderUpdate(order, shopDomain)

            logWebhookActivity({
                topic: topic,
                orderName: order.name,
                status: 'SUCCESS',
                message: `Erfolgreich verarbeitet. Status: ${result.status}`,
                details: { orderId: order.id }
            })

            return NextResponse.json({
                success: true,
                message: `Order update for ${order.name} processed`,
                invoiceId: result.id,
                status: result.status
            })
        } catch (processError) {
            logWebhookActivity({
                topic: topic,
                orderName: order.name,
                status: 'FAILED',
                message: `Fehler: ${processError instanceof Error ? processError.message : 'Unbekannt'}`,
                details: { error: processError }
            })
            throw processError
        }

    } catch (error) {
        console.error('❌ Webhook Update Error:', error)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
