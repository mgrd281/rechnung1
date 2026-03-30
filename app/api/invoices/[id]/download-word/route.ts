import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { generateWordInvoice } from '@/lib/word-generator'
import { getCompanySettings } from '@/lib/company-settings'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        // Require authentication
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }

        const { id: invoiceId } = await params
        console.log('📝 Generating Word download for invoice:', invoiceId)

        // Fetch invoice from Prisma
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                items: true
            }
        })

        if (!invoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            )
        }

        const companySettings = getCompanySettings()

        const invoiceData = {
            number: invoice.invoiceNumber,
            date: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate.toISOString(),
            subtotal: Number(invoice.totalNet),
            taxAmount: Number(invoice.totalTax),
            total: Number(invoice.totalGross),
            customer: {
                name: invoice.customer.name,
                address: invoice.customer.address,
                zipCode: invoice.customer.zipCode.replace(/^'/, ''),
                city: invoice.customer.city,
                country: invoice.customer.country,
                email: invoice.customer.email || undefined
            },
            organization: {
                name: companySettings.companyName || companySettings.name,
                address: companySettings.address,
                zipCode: companySettings.zip || companySettings.zipCode,
                city: companySettings.city,
                country: companySettings.country,
                taxId: companySettings.taxId || companySettings.taxNumber,
                bankName: companySettings.bankName,
                iban: companySettings.iban,
                bic: companySettings.bic,
                email: companySettings.email,
                phone: companySettings.phone
            },
            items: invoice.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                total: Number(item.grossAmount)
            }))
        }

        // Generate Word Document
        const buffer = await generateWordInvoice(invoiceData)

        // Create filename
        const customerName = invoice.customer.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer'
        const filename = `Rechnung-${invoice.invoiceNumber}-${customerName}.docx`

        // Return Word file as download
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        })

    } catch (error) {
        console.error('❌ Word download error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Word generation failed',
                message: 'Fehler beim Erstellen der Word-Datei.'
            },
            { status: 500 }
        )
    }
}
