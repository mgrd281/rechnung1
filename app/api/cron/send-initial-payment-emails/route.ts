import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'

export const dynamic = 'force-dynamic'

// Default settings
const DEFAULT_RECHNUNG_SETTINGS = {
    enabled: true,
    initialEmailSubject: 'Rechnung für Ihre Bestellung',
    initialEmailText: `Sehr geehrte Frau/Herr,

vielen Dank für Ihre Bestellung in unserem Onlineshop.

Bitte überweisen Sie den Gesamtbetrag Ihrer Rechnung innerhalb von 14 Tagen ab Rechnungsdatum auf das unten angegebene Konto. Nach Eingang Ihrer Zahlung wird Ihre Bestellung umgehend bearbeitet und versendet.

Zahlungsinformationen:

Empfänger: Karina Khrystych
Bank: N26 Bank
IBAN: DE22 1001 1001 2087 5043 11
BIC: NTSBDEB1XXX
Verwendungszweck: {orderNumber}

Hinweis:
Der Kauf auf Rechnung steht ausschließlich Geschäftskunden (B2B) zur Verfügung. Privatkunden bitten wir, eine andere verfügbare Zahlungsart zu wählen.

Sollten Sie Fragen zu Ihrer Rechnung oder Zahlung haben, stehen wir Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen

Ihr Team von Karinex`
}

export async function GET(req: Request) {
    try {
        console.log('⏰ Cron: Checking for initial payment emails (Rechnung)...')

        const shopify = new ShopifyAPI()

        // 1. Get Organization & Settings
        const organizations = await prisma.organization.findMany({
            include: { rechnungSettings: true }
        })

        const summary = {
            processed: 0,
            emailsSent: 0,
            errors: 0
        }

        for (const org of organizations) {
            const settings = org.rechnungSettings || DEFAULT_RECHNUNG_SETTINGS

            if (!settings.enabled) {
                continue
            }

            // 2. Fetch recent open orders
            // We want orders created > 3 minutes ago
            const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000)

            // Shopify API doesn't support "created_at_max" with minute precision reliably for this use case
            // So we fetch recent orders and filter manually
            const orders = await shopify.getOrders({
                status: 'open',
                financial_status: 'pending',
                limit: 50 // Check last 50 orders
            })

            for (const order of orders) {
                summary.processed++

                // Check payment method
                const gateways = (order as any).payment_gateway_names || []
                const gatewayStr = gateways.join(' ').toLowerCase()

                // Only target "Rechnung" (Invoice)
                if (!gatewayStr.includes('rechnung') && !gatewayStr.includes('invoice')) {
                    continue
                }

                // Check creation time
                const createdDate = new Date(order.created_at)
                if (createdDate > threeMinutesAgo) {
                    // Too new, wait for next run
                    continue
                }

                // Check if already sent in DB
                const dbOrder = await prisma.order.findFirst({
                    where: { shopifyOrderId: String(order.id) }
                })

                if (dbOrder && dbOrder.initialPaymentEmailSentAt) {
                    // Already sent
                    continue
                }

                // If DB order doesn't exist, create it (should exist via webhook, but fallback)
                // For now, if it doesn't exist, we skip to avoid complex creation logic here
                if (!dbOrder) {
                    console.warn(`Order ${order.name} not found in DB. Skipping initial email.`)
                    continue
                }

                // SEND EMAIL
                console.log(`📧 Sending initial payment email to ${order.name}`)

                const customerEmail = order.email || order.customer?.email
                if (!customerEmail) continue

                const text = settings.initialEmailText.replace('{orderNumber}', order.name)

                try {
                    await sendEmail({
                        to: customerEmail,
                        subject: settings.initialEmailSubject,
                        html: `<p>${text.replace(/\n/g, '<br>')}</p>`
                    })

                    // Update DB
                    await prisma.order.update({
                        where: { id: dbOrder.id },
                        data: { initialPaymentEmailSentAt: new Date() }
                    })

                    summary.emailsSent++
                } catch (err) {
                    console.error(`Failed to send email for ${order.name}:`, err)
                    summary.errors++
                }
            }
        }

        return NextResponse.json({ success: true, summary })

    } catch (error) {
        console.error('Error in initial-payment-email cron:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
