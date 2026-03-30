import { NextRequest, NextResponse } from 'next/server'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Validate essential data
        if (!data.invoiceData || !data.customer || !data.organization) {
            return NextResponse.json(
                { error: 'Missing required invoice data' },
                { status: 400 }
            )
        }

        // Map the incoming data to the format expected by the generator
        // This allows the frontend to send raw state from the "New Invoice" page
        const invoiceData = {
            id: data.id || 'preview-id',
            number: data.invoiceData.invoiceNumber,
            date: data.invoiceData.date,
            dueDate: data.invoiceData.dueDate || data.invoiceData.date,
            subtotal: data.subtotal || 0,
            taxRate: data.invoiceData.taxRate || 19,
            taxAmount: data.taxAmount || 0,
            total: data.total || 0,
            status: data.invoiceData.status || 'Entwurf',
            document_kind: data.documentKind,
            // Formatting & UI Settings
            layout: data.layout || 'classic',
            primaryColor: data.primaryColor,
            logoSize: data.logoSize,

            customer: {
                name: data.customer.name,
                companyName: data.customer.companyName,
                email: data.customer.email,
                address: data.customer.address,
                zipCode: data.customer.zipCode,
                city: data.customer.city,
                country: data.customer.country || 'DE'
            },
            organization: {
                name: data.organization.name || data.organization.companyName,
                address: data.organization.address,
                zipCode: data.organization.zipCode || data.organization.postalCode,
                city: data.organization.city,
                country: data.organization.country || 'DE',
                taxId: data.organization.taxId || data.organization.taxNumber,
                bankName: data.organization.bankName,
                iban: data.organization.iban,
                bic: data.organization.bic,
                email: data.organization.email,
                phone: data.organization.phone
            },
            items: data.items.map((item: any) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                ean: item.ean,
                unit: item.unit,
                vat: item.vat
            })),
            showSettings: {
                qrCode: data.showSettings?.qrCode || false,
                epcQrCode: data.showSettings?.epcQrCode || false,
                customerNumber: data.showSettings?.customerNumber ?? true,
                contactPerson: data.showSettings?.contactPerson ?? true,
                vatPerItem: data.showSettings?.vatPerItem || false,
                articleNumber: data.showSettings?.articleNumber || false,
                foldMarks: data.showSettings?.foldMarks ?? true,
                paymentTerms: data.showSettings?.paymentTerms ?? true,
                bankDetails: data.showSettings?.bankDetails ?? true,
                taxId: data.showSettings?.taxId ?? true
            },
            qrCodeSettings: data.showSettings?.qrCode || data.showSettings?.epcQrCode ? {
                enabled: true,
                paymentMethod: 'sepa',
                iban: data.organization.iban,
                bic: data.organization.bic,
                recipientName: data.organization.name || data.organization.companyName
            } : null
        }

        // Generate PDF
        const doc = await generateArizonaPDF(invoiceData as any)
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="preview.pdf"'
            }
        })
    } catch (error) {
        console.error('Error generating preview PDF:', error)
        return NextResponse.json(
            { error: 'Internal Server Error during PDF generation' },
            { status: 500 }
        )
    }
}
