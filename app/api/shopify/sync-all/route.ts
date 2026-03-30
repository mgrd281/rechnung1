import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { handleOrderCreate } from '@/lib/shopify-order-handler'
import { sendInvoiceEmail } from '@/lib/email-service'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 300; // Set timeout to 300 seconds (5 minutes)

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '50') // Default to 50 to be safe

        log(`🚀 Starting MASS IMPORT & SEND for last ${limit} orders...`)

        const api = new ShopifyAPI()
        // Fetch paid orders only
        const orders = await api.getOrders({ limit: limit, financial_status: 'paid' })

        log(`📦 Fetched ${orders.length} orders from Shopify. Processing...`)

        let results = []
        let sentCount = 0
        let skippedCount = 0

        for (const order of orders) {
            try {
                // 1. Create Invoice
                // We pass the shop domain if available, or null
                // 1. Create Invoice
                // We pass the shop domain if available, or null
                const invoice = await handleOrderCreate(order, process.env.SHOPIFY_SHOP_DOMAIN || null)

                // handleOrderCreate now always returns an invoice object (or throws)
                // It handles deduplication internally by returning the existing invoice

                if (invoice) {
                    // 2. Send Email
                    log(`📧 Sending email for Order ${order.name} to ${invoice.customer.email}...`)
                    const emailResult = await sendInvoiceEmail(
                        invoice.id,
                        invoice.customer.email,
                        invoice.customer.name,
                        invoice.number
                    )

                    results.push({
                        order: order.name,
                        status: 'sent',
                        email: invoice.customer.email,
                        success: emailResult.success
                    })
                    sentCount++
                } else {
                    results.push({ order: order.name, status: 'skipped_exists' })
                    skippedCount++
                }
            } catch (err: any) {
                log(`❌ Failed to process order ${order.name}: ${err.message}`)
                results.push({ order: order.name, status: 'error', error: err.message })
            }

            // Small delay to be nice to APIs
            await new Promise(r => setTimeout(r, 500))
        }

        log(`✅ Mass processing finished. Sent: ${sentCount}, Skipped: ${skippedCount}`)

        return NextResponse.json({
            success: true,
            message: `Processed ${orders.length} orders. Sent ${sentCount} emails.`,
            results: results
        })
    } catch (error: any) {
        log('❌ Critical error in mass sync:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
