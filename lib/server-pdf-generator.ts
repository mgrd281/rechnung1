import 'server-only'
import { prisma } from '@/lib/prisma'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'
import { mapPrismaInvoiceToData } from '@/lib/shopify-order-handler'

export async function generateArizonaPDFBuffer(invoiceId: string, isPrePaymentInvoice: boolean = false): Promise<Buffer | null> {
    try {
        // 1. Try to find in Prisma
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                organization: true,
                items: true,
                order: true
            }
        })

        if (!invoice) {
            console.error(`Invoice ${invoiceId} not found in DB for PDF generation`)
            return null
        }

        // 2. Map to InvoiceData
        const invoiceData = mapPrismaInvoiceToData(invoice)

        // 3. Add pre-payment flag for DEMO invoice (Vorkasse/Rechnung before payment)
        if (isPrePaymentInvoice) {
            (invoiceData as any).isPrePaymentInvoice = true
        }

        // 4. Generate PDF
        const doc = await generateArizonaPDF(invoiceData)

        // 5. Return Buffer
        return Buffer.from(doc.output('arraybuffer'))

    } catch (error) {
        console.error('Error generating Arizona PDF buffer:', error)
        return null
    }
}
