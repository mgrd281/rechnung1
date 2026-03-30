export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'

export async function GET() {
    try {
        console.log('🔔 Starting Dunning Run...')

        // 1. Get all enabled dunning settings
        const allSettings = await prisma.dunningSettings.findMany({
            where: { enabled: true },
            include: { organization: true }
        })

        const results = []

        for (const settings of allSettings) {
            console.log(`🏢 Processing organization: ${settings.organization.name}`)

            // 2. Get open invoices (SENT or OVERDUE)
            const invoices = await prisma.invoice.findMany({
                where: {
                    organizationId: settings.organizationId,
                    status: { in: ['SENT', 'OVERDUE'] },
                    totalNet: { gt: 0 } // Only positive amounts
                },
                include: {
                    customer: true,
                    dunningLogs: true,
                    items: true,
                    order: true
                }
            })

            for (const invoice of invoices) {
                // Filter by payment method: Only Vorkasse and Rechnung
                const method = (invoice.paymentMethod || '').toLowerCase()
                const isVorkasse = method.includes('vorkasse') || method === 'manual' || method === 'custom'
                const isRechnung = method.includes('rechnung')

                if (!isVorkasse && !isRechnung) {
                    continue
                }

                // Skip if paid (double check, though status check above should cover it)
                if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') continue

                const today = new Date()
                const dueDate = new Date(invoice.dueDate)

                // Calculate days overdue
                const diffTime = Math.abs(today.getTime() - dueDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                // If today is BEFORE due date, skip (not overdue yet)
                if (today < dueDate) continue

                const daysOverdue = diffDays

                // Check logs to see what has been sent
                const hasReminder = invoice.dunningLogs.some(l => l.level === 'REMINDER')
                const hasWarning1 = invoice.dunningLogs.some(l => l.level === 'WARNING1')
                const hasWarning2 = invoice.dunningLogs.some(l => l.level === 'WARNING2')
                const hasFinal = invoice.dunningLogs.some(l => l.level === 'FINAL')

                let actionToTake = null
                let surchargePercent = 0

                // Logic Chain
                if (daysOverdue >= settings.reminderDays && !hasReminder) {
                    actionToTake = 'REMINDER'
                    surchargePercent = 0
                }
                else if (daysOverdue >= (settings.reminderDays + settings.warning1Days) && hasReminder && !hasWarning1) {
                    actionToTake = 'WARNING1'
                    surchargePercent = Number(settings.warning1Surcharge)
                }
                else if (daysOverdue >= (settings.reminderDays + settings.warning1Days + settings.warning2Days) && hasWarning1 && !hasWarning2) {
                    actionToTake = 'WARNING2'
                    surchargePercent = Number(settings.warning2Surcharge)
                }
                else if (daysOverdue >= (settings.reminderDays + settings.warning1Days + settings.warning2Days + settings.finalWarningDays) && hasWarning2 && !hasFinal) {
                    actionToTake = 'FINAL'
                    surchargePercent = Number(settings.finalWarningSurcharge)
                }

                if (actionToTake) {
                    console.log(`⚡ Triggering ${actionToTake} for Invoice ${invoice.invoiceNumber} (Overdue: ${daysOverdue} days)`)

                    // Calculate Surcharge
                    const originalAmount = Number(invoice.totalGross)
                    const surchargeAmount = (originalAmount * surchargePercent) / 100
                    const totalOpenAmount = originalAmount + surchargeAmount // Note: This adds to the *current* step. 
                    // Ideally, surcharges accumulate. 
                    // If Warning 1 added 5%, and Warning 2 adds 3%, is it 3% on top of (100+5)? Or 3% of original?
                    // User said: "Zusätzlich wird ein weiterer Zuschlag von +3% auf den ursprünglichen Rechnungsbetrag erhoben"
                    // So it's based on original amount.

                    // We need to calculate TOTAL surcharge so far to show correct total
                    let totalSurchargeSoFar = surchargeAmount
                    if (actionToTake === 'WARNING2') {
                        totalSurchargeSoFar += (originalAmount * Number(settings.warning1Surcharge)) / 100
                    }
                    if (actionToTake === 'FINAL') {
                        totalSurchargeSoFar += (originalAmount * Number(settings.warning1Surcharge)) / 100
                        totalSurchargeSoFar += (originalAmount * Number(settings.warning2Surcharge)) / 100
                    }

                    const finalTotal = originalAmount + totalSurchargeSoFar

                    // Fetch Template
                    const template = await prisma.dunningTemplate.findUnique({
                        where: {
                            organizationId_level: {
                                organizationId: settings.organizationId,
                                level: actionToTake
                            }
                        }
                    })

                    // Fallback Template Content
                    let subject = template?.subject || getDefaultSubject(actionToTake, invoice.invoiceNumber)
                    let content = template?.content || getDefaultContent(actionToTake)

                    // Replace Variables
                    const variables = {
                        customer_name: invoice.customer.name,
                        invoice_number: invoice.invoiceNumber,
                        order_number: invoice.order?.orderNumber || '-',
                        original_amount: new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency }).format(originalAmount),
                        surcharge_amount: new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency }).format(totalSurchargeSoFar),
                        total_open_amount: new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency }).format(finalTotal),
                        due_date: new Date(invoice.dueDate).toLocaleDateString('de-DE')
                    }

                    const emailBody = replaceVariables(content, variables)
                    const emailSubject = replaceVariables(subject, variables)

                    // Send Email
                    if (invoice.customer.email) {
                        await sendEmail({
                            to: invoice.customer.email,
                            subject: emailSubject,
                            html: convertToHtml(emailBody)
                        })

                        // Log Action
                        await prisma.dunningLog.create({
                            data: {
                                invoiceId: invoice.id,
                                level: actionToTake,
                                surchargeAdded: surchargeAmount
                            }
                        })

                        // Update Invoice Status to OVERDUE if not already
                        if (invoice.status !== 'OVERDUE') {
                            await prisma.invoice.update({
                                where: { id: invoice.id },
                                data: { status: 'OVERDUE' }
                            })
                        }

                        results.push({
                            invoice: invoice.invoiceNumber,
                            action: actionToTake,
                            status: 'Sent'
                        })
                    } else {
                        console.error(`❌ No email for customer of invoice ${invoice.invoiceNumber}`)
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processed: results })

    } catch (error) {
        console.error('Dunning run failed:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

// Helpers
function getDefaultSubject(level: string, invoiceNumber: string) {
    switch (level) {
        case 'REMINDER': return `Zahlungserinnerung: Rechnung ${invoiceNumber}`
        case 'WARNING1': return `1. Mahnung: Rechnung ${invoiceNumber}`
        case 'WARNING2': return `2. Mahnung: Rechnung ${invoiceNumber}`
        case 'FINAL': return `LETZTE MAHNUNG: Rechnung ${invoiceNumber}`
        default: return `Info zu Rechnung ${invoiceNumber}`
    }
}

function getDefaultContent(level: string) {
    switch (level) {
        case 'REMINDER':
            return `Hallo {{ customer_name }},\n\nleider konnten wir noch keinen Zahlungseingang für die Rechnung {{ invoice_number }} feststellen.\nBitte überweisen Sie den offenen Betrag von {{ total_open_amount }} bis zum {{ due_date }}.\n\nViele Grüße`
        case 'WARNING1':
            return `Hallo {{ customer_name }},\n\ntrotz Erinnerung ist die Rechnung {{ invoice_number }} noch offen.\nWir haben eine Mahngebühr von {{ surcharge_amount }} erhoben.\nNeuer Gesamtbetrag: {{ total_open_amount }}.\n\nBitte zahlen Sie sofort.`
        case 'WARNING2':
            return `Hallo {{ customer_name }},\n\nSie haben auf unsere erste Mahnung nicht reagiert.\nEs fallen weitere Gebühren an.\nOffener Betrag: {{ total_open_amount }}.`
        case 'FINAL':
            return `LETZTE MAHNUNG\n\nHallo {{ customer_name }},\n\ndas ist die letzte Aufforderung zur Zahlung der Rechnung {{ invoice_number }}.\nGesamtbetrag: {{ total_open_amount }}.\n\nSollte keine Zahlung erfolgen, übergeben wir den Fall an ein Inkassobüro.`
        default: return ''
    }
}

function replaceVariables(template: string, variables: Record<string, string>) {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{ ${key} }}`, 'g'), value)
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
}

function convertToHtml(text: string) {
    return text.replace(/\n/g, '<br/>')
}
