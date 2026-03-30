import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'
import { getCompanySettings } from '@/lib/company-settings'
import { DocumentKind } from '@/lib/document-types'

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
    console.log('📄 Generating PDF download for invoice:', invoiceId)

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


    // Map Prisma invoice to InvoiceData for PDF generator
    const companySettings = getCompanySettings()
    const settings = (invoice.settings as any) || {}
    const design = settings.design || {}

    const invoiceData = {
      id: invoice.id,
      number: invoice.invoiceNumber,
      date: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      subtotal: Number(invoice.totalNet),
      taxRate: 19, // Default or fetch from items if needed
      taxAmount: Number(invoice.totalTax),
      total: Number(invoice.totalGross),
      status: invoice.status,
      document_kind: invoice.documentKind as DocumentKind,
      reference_number: invoice.referenceNumber || undefined,
      grund: invoice.reason || undefined,
      original_invoice_date: invoice.originalDate?.toISOString(),
      refund_amount: invoice.refundAmount ? Number(invoice.refundAmount) : undefined,
      // Design settings
      layout: design.templateId || 'classic',
      primaryColor: design.themeColor || undefined,
      logoSize: design.logoScale ? design.logoScale * 100 : undefined,
      showSettings: design.showSettings || undefined,
      customer: {
        name: invoice.customer.name,
        companyName: '', // Add to schema if needed
        email: invoice.customer.email || '',
        address: invoice.customer.address,
        zipCode: invoice.customer.zipCode.replace(/^'/, ''),
        city: invoice.customer.city,
        country: invoice.customer.country
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
        bic: companySettings.bic
      },
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.grossAmount),
        ean: item.ean || undefined
      })),
      qrCodeSettings: design.showSettings?.qrCode || design.showSettings?.epcQrCode ? {
        enabled: true,
        paymentMethod: 'sepa',
        iban: companySettings.iban,
        bic: companySettings.bic,
        recipientName: companySettings.companyName || companySettings.name
      } : null
    }

    // Generate PDF
    const doc = await generateArizonaPDF(invoiceData as any)
    const pdfArrayBuffer = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    // Create filename
    const customerName = invoice.customer.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer'
    const filename = `${invoice.invoiceNumber}-${customerName}.pdf`

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('❌ PDF download error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'PDF generation failed',
        message: 'Fehler beim Erstellen der PDF-Datei. Bitte versuchen Sie es erneut.'
      },
      { status: 500 }
    )
  }
}
