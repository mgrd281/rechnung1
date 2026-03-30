import { prisma } from '@/lib/prisma'

export type InvoiceEventType =
    | 'CREATED'
    | 'SENT'
    | 'VIEWED'
    | 'PAID'
    | 'REMINDER'
    | 'CANCELLED'
    | 'STATUS_CHANGE'

export async function logInvoiceEvent(invoiceId: string, type: InvoiceEventType, detail?: string) {
    try {
        await prisma.invoiceHistory.create({
            data: {
                invoiceId,
                type,
                detail
            }
        })
    } catch (error) {
        console.error('Failed to log invoice event:', error)
    }
}
