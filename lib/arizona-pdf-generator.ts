
import { jsPDF } from 'jspdf'
import { getCompanySettings } from './company-settings'
import { DocumentKind } from './document-types'
import { InvoiceTemplate, getTemplateById, getDefaultTemplate } from './invoice-templates'
import { generateQRCodeData } from './qr-code-generator'
import { addQRCodeToPDF } from './qr-code-pdf'

interface InvoiceData {
  id: string
  number: string
  date: string
  dueDate: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: string
  document_kind?: DocumentKind
  reference_number?: string
  grund?: string
  // Refund specific fields
  original_invoice_date?: string
  refund_amount?: number
  remaining_amount?: number
  // Pre-payment invoice (Vorkasse/Rechnung before payment - shows DEMO watermark)
  isPrePaymentInvoice?: boolean
  // Template information
  templateId?: string
  templateName?: string
  templateType?: string
  // Layout & Styling
  layout?: 'classic' | 'modern' | 'minimal' | 'bold'
  primaryColor?: string
  logoSize?: number
  showSettings?: {
    qrCode: boolean
    epcQrCode: boolean
    customerNumber: boolean
    contactPerson: boolean
    vatPerItem: boolean
    articleNumber: boolean
    foldMarks: boolean
    paymentTerms: boolean
    bankDetails: boolean
    taxId: boolean
  }
  // QR-Code payment settings
  qrCodeSettings?: {
    enabled: boolean
    paymentMethod: 'sepa' | 'paypal' | 'custom'
    iban?: string
    bic?: string
    paypalEmail?: string
    customText?: string
    recipientName?: string
    placement?: 'flex-beside-thanks' | 'left-below-table' | 'top-right-outside-info' | 'top-right-summary' | 'bottom-right-footer'
  } | null
  layoutConfigs?: {
    logo?: { x: number, y: number, scale: number, color?: string }
    senderLine?: { x: number, y: number, color?: string }
    infoBox?: { x: number, y: number, color?: string }
    recipient?: { x: number, y: number, color?: string }
    title?: { x: number, y: number, color?: string }
    body?: { x: number, y: number, color?: string }
    table?: { x: number, y: number, color?: string }
    totals?: { x: number, y: number, color?: string }
    footer?: { x: number, y: number, color?: string }
  }
  customer: {
    name: string
    companyName?: string
    email: string
    address: string
    zipCode: string
    city: string
    country: string
  }
  organization: {
    name: string
    address: string
    zipCode: string
    city: string
    country: string
    taxId: string
    bankName: string
    iban: string
    bic: string
    email?: string
    phone?: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    ean?: string
    unit?: string
    vat?: number
  }>
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return [0, 0, 0];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0] // Default to black
}

/**
 * Adds a rectangular stamp with border
 */
function addRectangularStamp(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor: [number, number, number],
  fontSize: number = 14
) {
  doc.setFillColor(...backgroundColor)
  doc.rect(x, y, width, height, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(1)
  doc.rect(x, y, width, height, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fontSize)
  doc.setTextColor(255, 255, 255)
  doc.text(text, x + width / 2, y + height / 2 + 2, { align: 'center' })
}

/**
 * Adds a diagonal watermark in the background
 */
function addDiagonalText(
  doc: jsPDF,
  text: string,
  color: [number, number, number],
  fontSize: number = 80
) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fontSize)
  doc.setTextColor(...color)
  const angle = -45 * Math.PI / 180
  doc.text(text, 105, 148, { angle: angle, align: 'center' })
}

/**
 * Main function to add stamps and watermarks
 */
function addDocumentStamps(doc: jsPDF, documentKind?: DocumentKind, isPrePaymentInvoice?: boolean) {
  if (documentKind === DocumentKind.CANCELLATION) {
    addRectangularStamp(doc, 'STORNO', 85, 130, 40, 20, [220, 38, 38], 14)
    addDiagonalText(doc, 'STORNO', [200, 200, 200], 80)
  }
  if (isPrePaymentInvoice) {
    addDiagonalText(doc, 'DEMO', [220, 220, 220], 100)
    addRectangularStamp(doc, 'DEMO', 165, 8, 35, 12, [255, 140, 0], 10)
  }
}

/**
 * Add payment information box for pre-payment invoices (Vorkasse/Rechnung)
 */
function addPaymentInfoBox(
  doc: jsPDF,
  yPosition: number,
  organization: InvoiceData['organization'],
  invoiceNumber: string,
  total: number,
  primaryColorRGB: [number, number, number]
): number {
  const boxX = 20
  const boxWidth = 170
  const boxPadding = 8

  doc.setFillColor(255, 248, 230)
  doc.setDrawColor(...primaryColorRGB)
  doc.setLineWidth(1)
  doc.roundedRect(boxX, yPosition, boxWidth, 55, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColorRGB)
  doc.text('💳 ZAHLUNGSINFORMATIONEN', boxX + boxPadding, yPosition + 10)

  doc.setDrawColor(...primaryColorRGB)
  doc.setLineWidth(0.3)
  doc.line(boxX + boxPadding, yPosition + 14, boxX + boxWidth - boxPadding, yPosition + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)

  let infoY = yPosition + 22
  doc.setFont('helvetica', 'bold')
  doc.text('Empfänger:', boxX + boxPadding, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(organization?.name || 'Karinex', boxX + boxPadding + 28, infoY)

  infoY += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Bank:', boxX + boxPadding, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(organization?.bankName || '-', boxX + boxPadding + 28, infoY)

  infoY += 6
  doc.setFont('helvetica', 'bold')
  doc.text('IBAN:', boxX + boxPadding, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(organization?.iban || '-', boxX + boxPadding + 28, infoY)

  infoY += 6
  doc.setFont('helvetica', 'bold')
  doc.text('BIC:', boxX + boxPadding, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(organization?.bic || '-', boxX + boxPadding + 28, infoY)

  const rightColX = boxX + 105
  infoY = yPosition + 22
  doc.setFont('helvetica', 'bold')
  doc.text('Verwendungszweck:', rightColX, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(invoiceNumber, rightColX + 40, infoY)

  infoY += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Betrag:', rightColX, infoY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 100, 0)
  doc.text(`${total.toFixed(2)} EUR`, rightColX + 40, infoY)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer als Verwendungszweck.', boxX + boxPadding, yPosition + 50)

  return yPosition + 60
}

export async function generateArizonaPDF(invoice: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF()
  const companySettings = getCompanySettings()

  // Branding Logic
  const primaryColorHex = invoice.primaryColor || '#000000'
  const primaryColorRGB: [number, number, number] = hexToRgb(primaryColorHex)
  const logoScaleGlobal = invoice.logoSize ? invoice.logoSize / 100 : 1.0

  const renderItemsTable = (startY: number, tableX = 18, tableWidth = 175) => {
    let yPos = startY
    const colBezeichnung = tableX + 4
    const colEAN = tableX + 70
    const colMenge = tableX + 95
    const colMwSt = tableX + 115
    const colPreis = tableX + 135
    const colGesamt = tableX + tableWidth - 4

    const headerBgColor = '#E8F3F1'
    const headerBorderColor = '#5B8272'

    doc.setFillColor(...hexToRgb(headerBgColor))
    doc.rect(tableX, yPos - 5, tableWidth, 9, 'F')

    // Borders top and bottom
    doc.setDrawColor(...hexToRgb(headerBorderColor))
    doc.setLineWidth(0.3)
    doc.line(tableX, yPos - 5, tableX + tableWidth, yPos - 5) // Top
    doc.line(tableX, yPos + 4, tableX + tableWidth, yPos + 4) // Bottom

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 80, 75) // Dark teal text

    doc.text('Bezeichnung', colBezeichnung, yPos)
    doc.text('EAN', colEAN, yPos, { align: 'center' })
    doc.text('Menge', colMenge, yPos, { align: 'center' })
    doc.text('MwSt.', colMwSt, yPos, { align: 'center' })
    doc.text('Preis', colPreis, yPos, { align: 'right' })
    doc.text('Gesamt', colGesamt, yPos, { align: 'right' })

    yPos += 12
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)

    invoice.items.forEach((item) => {
      const desc = doc.splitTextToSize(item.description || '', 55)
      doc.text(desc, colBezeichnung, yPos)
      doc.text(String(item.ean || '-'), colEAN, yPos, { align: 'center' })
      doc.text(`${item.quantity} ${item.unit || 'Stk.'}`, colMenge, yPos, { align: 'center' })
      doc.text(`${item.vat || invoice.taxRate || 19}%`, colMwSt, yPos, { align: 'center' })
      doc.text(item.unitPrice.toFixed(2), colPreis, yPos, { align: 'right' })
      doc.text(item.total.toFixed(2), colGesamt, yPos, { align: 'right' })
      yPos += (desc.length * 4.5) + 4
    })

    yPos += 10
    const totalsBoxW = 60
    const totalsBoxX = tableX + tableWidth - totalsBoxW

    doc.setDrawColor(...hexToRgb('#D0E0DE'))
    doc.setLineWidth(0.3)
    doc.line(totalsBoxX, yPos - 5, tableX + tableWidth, yPos - 5)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Summe netto', totalsBoxX, yPos)
    doc.text(invoice.subtotal.toFixed(2), tableX + tableWidth, yPos, { align: 'right' })

    yPos += 7
    doc.text(`MwSt. ${invoice.taxRate || 19}%`, totalsBoxX, yPos)
    doc.text(invoice.taxAmount.toFixed(2), tableX + tableWidth, yPos, { align: 'right' })

    yPos += 4
    doc.line(totalsBoxX, yPos, tableX + tableWidth, yPos)

    yPos += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text('Gesamt', totalsBoxX, yPos)
    doc.text(`${invoice.total.toFixed(2)}`, tableX + tableWidth, yPos, { align: 'right' })

    doc.line(totalsBoxX, yPos + 2, tableX + tableWidth, yPos + 2)
  }

  const renderClassic = () => {
    doc.setFont('helvetica')
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, 210, 297, 'F')

    // ========================================
    // LOGO - Solid Green Bar
    // ========================================
    const logoX = invoice.layoutConfigs?.logo?.x || 20
    const logoY = invoice.layoutConfigs?.logo?.y || 18
    const logoScale = invoice.layoutConfigs?.logo?.scale || logoScaleGlobal
    const logoH = 14 * logoScale
    const logoColorHex = invoice.layoutConfigs?.logo?.color || '#5B8272' // Specific Green
    const logoColorRGB = hexToRgb(logoColorHex)

    const displayCompanyName = (invoice.organization?.name || companySettings.companyName || companySettings.name || 'KARINEX').toUpperCase()

    doc.setFillColor(...logoColorRGB)
    doc.rect(logoX, logoY, 80 * logoScale, logoH, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24 * logoScale)
    doc.setTextColor(255, 255, 255)
    doc.text(displayCompanyName, logoX + 4, logoY + logoH - (3.5 * logoScale))

    // ========================================
    // SENDER LINE
    // ========================================
    const senderX = invoice.layoutConfigs?.senderLine?.x || 20
    const senderY = invoice.layoutConfigs?.senderLine?.y || 52
    const senderLine = `${invoice.organization?.name || companySettings.companyName || 'Karina Khrystych'} • ${invoice.organization?.address || 'Havighorster Redder 51'} • ${invoice.organization?.zipCode || '22115'} ${invoice.organization?.city || 'Hamburg'}`
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(senderLine, senderX, senderY)

    // ========================================
    // INFO BOX (Top Right) - Modern Background Style
    // ========================================
    const boxX = invoice.layoutConfigs?.infoBox?.x || 130
    const boxY = invoice.layoutConfigs?.infoBox?.y || 45
    const boxW = 60
    const boxH = 45
    const infoBgColor = '#E8F3F1'

    doc.setFillColor(...hexToRgb(infoBgColor))
    doc.rect(boxX, boxY, boxW, boxH, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('Rechnung', boxX + 6, boxY + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const invoiceDate = new Date(invoice.date).toLocaleDateString('de-DE')

    doc.text('Rechnungs-Nr.', boxX + 6, boxY + 18)
    doc.text(invoice.number.replace(/^#/, ''), boxX + boxW - 6, boxY + 18, { align: 'right' })

    doc.text('Kunden-Nr.', boxX + 6, boxY + 24)
    doc.text((invoice as any).customerNumber || 'inv-1758', boxX + boxW - 6, boxY + 24, { align: 'right' })

    doc.text('Rechnungsdatum', boxX + 6, boxY + 30)
    doc.text(invoiceDate, boxX + boxW - 6, boxY + 30, { align: 'right' })

    // ========================================
    // RECIPIENT
    // ========================================
    const recX = invoice.layoutConfigs?.recipient?.x || 20
    let recipientY = invoice.layoutConfigs?.recipient?.y || 75

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(invoice.customer.name || '', recX, recipientY)

    recipientY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (invoice.customer.companyName) {
      doc.text(invoice.customer.companyName, recX, recipientY)
      recipientY += 5
    }
    doc.text(invoice.customer.address || '', recX, recipientY)
    recipientY += 5
    doc.text(`${invoice.customer.zipCode || ''} ${invoice.customer.city || ''}`, recX, recipientY)
    recipientY += 5
    doc.text(invoice.customer.country || 'Deutschland', recX, recipientY)

    // ========================================
    // RECHNUNG TITLE
    // ========================================
    const titleX = invoice.layoutConfigs?.title?.x || 20
    const titleY = invoice.layoutConfigs?.title?.y || 135
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('Rechnung', titleX, titleY)

    const bodyX = invoice.layoutConfigs?.body?.x || 20
    const bodyY = invoice.layoutConfigs?.body?.y || 145
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Lieferung bzw. Leistung:', bodyX, bodyY)

    const tableX = invoice.layoutConfigs?.table?.x || 18
    const tableY = invoice.layoutConfigs?.table?.y || 160
    renderItemsTable(tableY, tableX)
  }

  renderClassic()

  // ========================================
  // FOOTER - Light Green Full Width (Exact per Image)
  // ========================================
  const footerY = 252
  const footerHeight = 45
  const footerBgColor = '#E8F3F1'

  doc.setFillColor(...hexToRgb(footerBgColor))
  doc.rect(0, footerY, 210, footerHeight, 'F')

  doc.setFontSize(7)
  doc.setTextColor(60, 80, 75) // Dark teal
  doc.setFont('helvetica', 'normal')

  const col1X = 20, col2X = 75, col3X = 135, lineHeight = 3.8
  const companyName = invoice.organization?.name || companySettings.companyName || companySettings.name || 'KARINEX'
  const footerAddress = invoice.organization?.address || companySettings.address || 'Havighorster Redder 51'
  const footerZip = invoice.organization?.zipCode || companySettings.zipCode || '22115'
  const footerCity = invoice.organization?.city || companySettings.city || 'Hamburg'
  const footerCountry = invoice.organization?.country || 'DE'
  const footerPhone = invoice.organization?.phone || companySettings.phone || '01556 / 3133856'
  const footerEmail = invoice.organization?.email || companySettings.email || 'Rechnung@karinex.de'
  const footerBank = invoice.organization?.bankName || companySettings.bankName || 'N26'
  const footerIban = invoice.organization?.iban || companySettings.iban || 'DE22 1001 1001 2087 5043 11'
  const footerBic = invoice.organization?.bic || companySettings.bic || 'NTSBDEB1XXX'
  const footerTaxId = invoice.organization?.taxId || companySettings.taxId || 'DE452578048'
  const footerVatId = companySettings.vatId || 'DE123456789'

  let y = footerY + 8
  // Column 1
  doc.text('Karina Khrystych', col1X, y)
  doc.text(footerAddress, col1X, y + lineHeight)
  doc.text(`${footerZip} ${footerCity}`, col1X, y + lineHeight * 2)
  doc.text(footerCountry, col1X, y + lineHeight * 3)

  // Column 2
  doc.text(`Geschäftsführer: Karina Khrystych`, col2X, y)
  doc.text(`Telefon: ${footerPhone}`, col2X, y + lineHeight)
  doc.text(`E-Mail: ${footerEmail}`, col2X, y + lineHeight * 2)

  // Column 3
  doc.text('Bankverbindungen', col3X, y)
  doc.text(footerBank, col3X, y + lineHeight)
  doc.text(`IBAN: ${footerIban}`, col3X, y + lineHeight * 2)
  doc.text(`BIC: ${footerBic}`, col3X, y + lineHeight * 3)

  // Bottom Row for Tax IDs (Aligned with Col 2 and Col 3)
  const taxY = footerY + 36
  doc.text(`Steuernummer: ${footerTaxId}`, col2X, taxY)
  doc.text(`USt.-IdNr.: ${footerVatId}`, col3X, taxY)

  if (invoice.isPrePaymentInvoice) {
    addDocumentStamps(doc, undefined, true)
    addPaymentInfoBox(doc, 82, invoice.organization, invoice.number, invoice.total, primaryColorRGB)
  }

  if (invoice.showSettings?.qrCode || invoice.showSettings?.epcQrCode) {
    if (invoice.qrCodeSettings) {
      await addQRCodeToPDF(doc, {
        iban: invoice.qrCodeSettings.iban || '',
        bic: invoice.qrCodeSettings.bic || '',
        recipientName: invoice.qrCodeSettings.recipientName || '',
        amount: invoice.total,
        reference: invoice.number
      } as any)
    }
  }

  return doc
}

export async function saveArizonaPDF(invoice: InvoiceData): Promise<void> {
  const doc = await generateArizonaPDF(invoice)
  const customerName = (invoice.customer.name || 'customer').replace(/[^a-zA-Z0-9]/g, '-')
  const filename = `${invoice.number}-${customerName}.pdf`
  doc.save(filename)
}
