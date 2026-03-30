export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWebhookLogs } from '@/lib/webhook-logger'
import { exportEmailLogs } from '@/lib/email-tracking'

export async function GET() {
    try {
        // 1. Get Webhook Logs
        const webhookLogs = getWebhookLogs()

        // 2. Get Email Logs (from memory tracking)
        const emailLogs = exportEmailLogs()
            .sort((a, b) => {
                const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0
                const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0
                return dateB - dateA
            })
            .slice(0, 50)
            .map(log => ({
                id: log.id,
                recipient: log.recipientEmail,
                subject: log.metadata?.invoiceNumber ? `Rechnung ${log.metadata.invoiceNumber}` : 'Digitaler Key',
                status: log.status,
                sentAt: log.sentAt || log.failedAt || new Date(),
                error: log.errorMessage
            }))

        // 3. Get Inventory Status
        const inventory = await prisma.digitalProduct.findMany({
            select: {
                id: true,
                title: true,
                shopifyProductId: true,
                _count: {
                    select: { keys: { where: { isUsed: false } } }
                }
            }
        })

        return NextResponse.json({
            success: true,
            webhookLogs,
            emailLogs,
            inventory
        })

    } catch (error) {
        console.error('Diagnostics API error:', error)
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 })
    }
}
