import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'
import { DocumentKind } from '@/lib/document-types'

// Test invoice data
const createTestInvoice = (documentKind?: DocumentKind, status?: string) => ({
  id: 'test-001',
  number: documentKind === DocumentKind.CANCELLATION ? 'ST-2024-001' :
    documentKind === DocumentKind.CREDIT_NOTE ? 'GS-2024-001' : 'RE-2024-001',
  date: new Date().toISOString(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  subtotal: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -100.00 : 100.00,
  taxRate: 19,
  taxAmount: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -19.00 : 19.00,
  total: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -119.00 : 119.00,
  status: status || 'Offen',
  document_kind: documentKind,
  reference_number: documentKind === DocumentKind.CANCELLATION ? 'RE-2024-001' :
    documentKind === DocumentKind.CREDIT_NOTE ? 'RE-2024-001' : undefined,
  grund: documentKind === DocumentKind.CANCELLATION ? 'Auf Kundenwunsch' :
    documentKind === DocumentKind.CREDIT_NOTE ? 'Defekte Ware' : undefined,
  customer: {
    name: 'Max Mustermann',
    email: 'max.mustermann@example.com',
    address: 'Musterstraße 123',
    zipCode: '12345',
    city: 'Musterstadt',
    country: 'Deutschland'
  },
  organization: {
    name: 'KARNEX',
    address: 'Havighorster Redder 51',
    zipCode: '22115',
    city: 'Hamburg',
    country: 'Deutschland',
    taxId: 'DE123456789',
    bankName: 'Sparkasse Hamburg',
    iban: 'DE89 3704 0044 0532 0130 00',
    bic: 'COBADEFFXXX'
  },
  items: [
    {
      description: 'Test Produkt 1',
      quantity: 2,
      unitPrice: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -25.00 : 25.00,
      total: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -50.00 : 50.00,
      ean: '1234567890123'
    },
    {
      description: 'Test Produkt 2 mit sehr langem Namen der über mehrere Zeilen gehen könnte',
      quantity: 1,
      unitPrice: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -50.00 : 50.00,
      total: documentKind === DocumentKind.CANCELLATION || documentKind === DocumentKind.CREDIT_NOTE ? -50.00 : 50.00,
      ean: '9876543210987'
    }
  ]
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'normal'

    let documentKind: DocumentKind | undefined
    let status = 'Offen'

    switch (type) {
      case 'storno':
        documentKind = DocumentKind.CANCELLATION
        status = 'Storniert'
        break
      case 'gutschrift':
        documentKind = DocumentKind.CREDIT_NOTE
        status = 'Gutschrift'
        break
      case 'normal':
      default:
        documentKind = undefined
        status = 'Offen'
        break
    }

    const testInvoice = createTestInvoice(documentKind, status)
    const doc = await generateArizonaPDF(testInvoice as any)

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    const filename = type === 'storno' ? 'Test-Storno.pdf' :
      type === 'gutschrift' ? 'Test-Gutschrift.pdf' :
        'Test-Rechnung.pdf'

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating test PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate test PDF' },
      { status: 500 }
    )
  }
}
