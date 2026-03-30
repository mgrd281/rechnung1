import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Persistent webhook log storage (in-memory for serverless, but helps with debugging)
interface WebhookLogEntry {
    id: string;
    timestamp: string;
    topic: string;
    orderNumber: string;
    shopDomain: string | null;
    hmacValid: boolean | null;
    processed: boolean;
    error: string | null;
    invoiceCreated: boolean;
    emailSent: boolean;
    keysDelivered: boolean;
    processingTimeMs: number;
    customerTrace?: string;
    organizationName?: string;
}

// Store last 50 webhook events
let webhookLogs: WebhookLogEntry[] = [];

// Verify Shopify Webhook HMAC
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
    const startTime = Date.now()
    const logEntry: WebhookLogEntry = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        topic: req.headers.get('x-shopify-topic') || 'unknown',
        orderNumber: '',
        shopDomain: req.headers.get('x-shopify-shop-domain'),
        hmacValid: null,
        processed: false,
        error: null,
        invoiceCreated: false,
        emailSent: false,
        keysDelivered: false,
        processingTimeMs: 0,
        customerTrace: '',
        organizationName: ''
    }

    try {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`🆕 INCOMING WEBHOOK: ${logEntry.topic}`)
        console.log(`   Time: ${logEntry.timestamp}`)
        console.log(`   Shop: ${logEntry.shopDomain}`)
        console.log(`${'='.repeat(60)}`)

        // 1. Verify Webhook HMAC
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET
        let order: any

        if (secret) {
            const { valid, rawBody } = await verifyWebhook(req, secret)
            logEntry.hmacValid = valid
            if (!valid) {
                console.error('❌ HMAC VERIFICATION FAILED')
                logEntry.error = 'Invalid HMAC signature'
                logEntry.processingTimeMs = Date.now() - startTime
                webhookLogs.unshift(logEntry)
                if (webhookLogs.length > 50) webhookLogs.pop()
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            order = JSON.parse(rawBody)
            console.log('✅ HMAC Verified')
        } else {
            console.warn('⚠️ No SHOPIFY_API_SECRET found, skipping HMAC check')
            logEntry.hmacValid = null // Unknown
            order = await req.json()
        }

        logEntry.orderNumber = order.name || order.order_number || 'unknown'
        console.log(`📦 Order: ${logEntry.orderNumber}`)
        console.log(`   ID: ${order.id}`)
        console.log(`   Financial: ${order.financial_status}`)
        console.log(`   Email: ${order.email || order.customer?.email || 'N/A'}`)

        // 2. Import and process the order
        const { handleOrderCreate } = await import('@/lib/shopify-order-handler')

        console.log('🔄 Processing order...')
        const result = await handleOrderCreate(order, logEntry.shopDomain, true)

        logEntry.invoiceCreated = !!result.id
        logEntry.processed = true
        logEntry.customerTrace = result.customerTrace
        logEntry.organizationName = result.organization?.name || 'Unknown'

        console.log(`✅ Order ${logEntry.orderNumber} processed successfully`)
        console.log(`   Invoice ID: ${result.id}`)
        console.log(`   Invoice Number: ${result.number}`)
        console.log(`   Status: ${result.status}`)

        logEntry.processingTimeMs = Date.now() - startTime

        const { logWebhookActivity } = await import('@/lib/webhook-logger')
        logWebhookActivity({
            topic: logEntry.topic,
            orderName: logEntry.orderNumber,
            status: 'SUCCESS',
            message: `Bestellung erfolgreich importiert. Status: ${result.status}`,
            details: { invoiceId: result.id, processingTimeMs: logEntry.processingTimeMs }
        })

        // Store log
        webhookLogs.unshift(logEntry)
        if (webhookLogs.length > 50) webhookLogs.pop()

        return NextResponse.json({
            success: true,
            message: `Order ${logEntry.orderNumber} processed`,
            invoiceId: result.id,
            invoiceNumber: result.number,
            processingTimeMs: logEntry.processingTimeMs
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Webhook Error:', error)

        logEntry.error = errorMessage
        logEntry.processingTimeMs = Date.now() - startTime

        const { logWebhookActivity } = await import('@/lib/webhook-logger')
        logWebhookActivity({
            topic: logEntry.topic,
            orderName: logEntry.orderNumber,
            status: 'FAILED',
            message: `Import fehlgeschlagen: ${errorMessage}`,
            details: { error: errorMessage }
        })

        // Store log even on failure
        webhookLogs.unshift(logEntry)
        if (webhookLogs.length > 50) webhookLogs.pop()

        return NextResponse.json({
            error: 'Internal Server Error',
            details: errorMessage
        }, { status: 500 })
    }
}

// GET endpoint to retrieve webhook logs for debugging
export async function GET(request: NextRequest) {
    // Also fetch basic organization info to show in diagnostics
    const org = await prisma.organization.findFirst({
        select: { name: true, address: true, city: true, country: true }
    })

    // Gather Email Diagnostics
    const emailDiagnostics = {
        devMode: process.env.EMAIL_DEV_MODE === 'true',
        resendActive: !!process.env.RESEND_API_KEY,
        smtpActive: !!(process.env.SMTP_USER || process.env.EMAIL_USER),
        fromEmail: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'Not Set',
        replyTo: process.env.EMAIL_REPLY_TO || 'Not Set'
    }

    return NextResponse.json({
        title: 'Recent Webhook Events',
        count: webhookLogs.length,
        organization: org,
        emailService: emailDiagnostics,
        logs: webhookLogs.slice(0, 20).map(log => ({
            ...log,
            // Mask sensitive data
            shopDomain: log.shopDomain ? '***' + log.shopDomain.slice(-15) : null
        })),
        serverTime: new Date().toISOString(),
        note: 'Logs are stored in-memory and reset on server restart. Check Vercel logs for full history.'
    })
}
