import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'
import { getBusinessDaysDiff } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

// Default settings if not configured in DB
const DEFAULT_VORKASSE_SETTINGS = {
    enabled: true,
    reminder1Days: 3,
    reminder1Subject: 'Zahlungserinnerung für Ihre Bestellung',
    reminder1Text: 'Hallo, wir haben festgestellt, dass Ihre Bestellung (Nr. {orderNumber}) noch nicht bezahlt wurde.\nBitte überweisen Sie den offenen Betrag.\nVielen Dank!',

    reminder2Days: 10,
    reminder2Subject: 'Letzte Zahlungserinnerung',
    reminder2Text: 'Dies ist eine letzte Zahlungserinnerung für Ihre Bestellung (Nr. {orderNumber}).\nBitte begleichen Sie den Betrag, um eine automatische Stornierung zu vermeiden.',

    cancellationDays: 14, // 10 + 4
    cancellationSubject: 'Bestellung storniert',
    cancellationText: 'Wenn wir Ihre Zahlung innerhalb von 4 Tagen nicht erhalten, wird die Bestellung automatisch storniert.'
}

const DEFAULT_RECHNUNG_SETTINGS = {
    ...DEFAULT_VORKASSE_SETTINGS,
    // Can override specific texts here if needed, but user requested "same thing" for reminders
}

export async function GET(req: Request) {
    try {
        console.log('⏰ Cron: Checking for Vorkasse/Rechnung reminders and cancellations...')

        const shopify = new ShopifyAPI()

        // 1. Get Organization & Settings
        // Assuming single organization for now or loop through all
        const organizations = await prisma.organization.findMany({
            include: {
                vorkasseSettings: true,
                rechnungSettings: true
            }
        })

        const summary = {
            processed: 0,
            remindersSent: 0,
            cancellations: 0,
            errors: 0
        }

        for (const org of organizations) {
            const vorkasseSettings = org.vorkasseSettings || DEFAULT_VORKASSE_SETTINGS
            const rechnungSettings = org.rechnungSettings || DEFAULT_RECHNUNG_SETTINGS

            // 2. Fetch Pending Orders from DB (to track reminder level)
            // We need to sync with Shopify to get current status first?
            // Or fetch from Shopify and match with DB?
            // Fetching from Shopify is safer for current status.

            // Fetch open pending orders
            const orders = await shopify.getOrders({
                status: 'open',
                financial_status: 'pending',
                limit: 250 // Process in batches
            })

            console.log(`Found ${orders.length} pending orders for potential action.`)

            for (const order of orders) {
                summary.processed++

                // Check payment method
                const gateways = (order as any).payment_gateway_names || []
                const gatewayStr = gateways.join(' ').toLowerCase()

                let settings = null
                let isTarget = false

                if (gatewayStr.includes('vorkasse') || gatewayStr.includes('bank') || gatewayStr.includes('transfer')) {
                    settings = vorkasseSettings
                    isTarget = true
                } else if (gatewayStr.includes('rechnung') || gatewayStr.includes('invoice')) {
                    settings = rechnungSettings
                    isTarget = true
                } else if (gatewayStr === '') {
                    // Manual/Unknown - default to Vorkasse settings
                    settings = vorkasseSettings
                    isTarget = true
                }

                if (!isTarget || !settings || !settings.enabled) continue

                // Calculate Age using Business Days
                const createdDate = new Date(order.created_at)
                const now = new Date()

                // Use Business Days (excluding weekends)
                const diffDays = getBusinessDaysDiff(createdDate, now)

                console.log(`Order ${order.name}: ${diffDays} business days old. Gateway: ${gatewayStr}`)

                // Get DB Order to check reminder level
                let dbOrder = await prisma.order.findFirst({
                    where: { shopifyOrderId: String(order.id) }
                })

                // If not in DB, create it (should exist from webhook, but safety first)
                if (!dbOrder) {
                    // Skip creating for now, just log warning, or create minimal
                    console.warn(`Order ${order.name} not found in DB. Skipping tracking.`)
                    continue
                }

                const currentLevel = dbOrder.vorkasseReminderLevel
                const customerEmail = order.email || order.customer?.email

                if (!customerEmail) {
                    console.log(`No email for order ${order.name}, skipping.`)
                    continue
                }

                // LOGIC FLOW

                // 1. Cancellation (Day 14+)
                if (diffDays >= settings.cancellationDays) {
                    console.log(`🚫 Cancelling order ${order.name} (Age: ${diffDays} business days)`)
                    try {
                        await shopify.cancelOrder(order.id)

                        // Update DB
                        await prisma.order.update({
                            where: { id: dbOrder.id },
                            data: { status: 'CANCELLED' }
                        })

                        // Send Cancellation Email? User didn't explicitly ask for email ON cancellation,
                        // but "Warning BEFORE cancellation".
                        // "3) Automatische Stornierung ... Benachrichtigung an den Kunden senden." -> Yes, send notification.

                        await sendEmail({
                            to: customerEmail,
                            subject: `Stornierung Ihrer Bestellung ${order.name}`,
                            html: `<p>Sehr geehrte Kundin, sehr geehrter Kunde,</p>
                                   <p>${settings.cancellationText}</p>
                                   <p>Mit freundlichen Grüßen<br>${org.name}</p>`
                        })

                        summary.cancellations++
                    } catch (err) {
                        console.error(`Failed to cancel ${order.name}:`, err)
                        summary.errors++
                    }
                    continue // Stop processing this order
                }

                // 2. Warning before Cancellation (Day 10+) -> Reminder 2
                // User said: "Reminder after 10 days... Warning: if not paid in 4 days auto cancel"
                // This is effectively the 2nd reminder.
                if (diffDays >= settings.reminder2Days && currentLevel < 2) {
                    console.log(`⚠️ Sending 2nd Reminder to ${order.name}`)

                    const text = settings.reminder2Text.replace('{orderNumber}', order.name)
                    const warningText = "\n\nWenn wir Ihre Zahlung innerhalb von 4 Tagen nicht erhalten, wird die Bestellung automatisch storniert."

                    await sendEmail({
                        to: customerEmail,
                        subject: settings.reminder2Subject,
                        html: `<p>${text.replace(/\n/g, '<br>')}</p><p><strong>${warningText}</strong></p>`
                    })

                    await prisma.order.update({
                        where: { id: dbOrder.id },
                        data: {
                            vorkasseReminderLevel: 2,
                            vorkasseLastReminderAt: new Date()
                        }
                    })
                    summary.remindersSent++
                    continue
                }

                // 3. First Reminder (Day 3+)
                if (diffDays >= settings.reminder1Days && currentLevel < 1) {
                    console.log(`ℹ️ Sending 1st Reminder to ${order.name}`)

                    const text = settings.reminder1Text.replace('{orderNumber}', order.name)

                    await sendEmail({
                        to: customerEmail,
                        subject: settings.reminder1Subject,
                        html: `<p>${text.replace(/\n/g, '<br>')}</p>`
                    })

                    await prisma.order.update({
                        where: { id: dbOrder.id },
                        data: {
                            vorkasseReminderLevel: 1,
                            vorkasseLastReminderAt: new Date()
                        }
                    })
                    summary.remindersSent++
                    continue
                }
            }
        }

        return NextResponse.json({ success: true, summary })

    } catch (error) {
        console.error('Error in payment-reminders cron:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
