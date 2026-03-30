// QR-Code PDF-Integration - Echte QR-Code-Generierung für PDF

import QRCode from 'qrcode'
import { generateQRCodeData, QRCodePaymentData } from './qr-code-generator'

/**
 * Generiere QR-Code als Base64-Daten-URL für PDF-Einbettung
 */
export async function generateQRCodeForPDF(
  paymentData: QRCodePaymentData,
  sizeInMM: number = 30
): Promise<string | null> {
  try {
    // Generate the QR-Code data according to SEPA/EPC standards
    const qrData = generateQRCodeData(paymentData)
    console.log('Generated QR-Code data:', qrData)

    // Calculate size in pixels (assuming 300 DPI)
    // 1 inch = 25.4 mm, 300 DPI = 300 pixels per inch
    const dpi = 300
    const sizeInPixels = Math.round((sizeInMM / 25.4) * dpi)

    console.log(`QR-Code size: ${sizeInMM}mm = ${sizeInPixels}px at 300 DPI`)

    // Generate QR-Code with optimized settings for scanning
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: sizeInPixels,
      margin: 4, // Quiet zone - 4 modules minimum as required
      color: {
        dark: '#000000',    // Pure black - no gradients
        light: '#FFFFFF'    // Pure white background
      },
      errorCorrectionLevel: 'Q', // High error correction (25% recovery) for better scanning
      rendererOpts: {
        quality: 1.0 // Maximum quality for crisp edges
      }
    })

    console.log('QR-Code generated successfully for PDF')
    return qrCodeDataURL

  } catch (error) {
    console.error('Failed to generate QR-Code for PDF:', error)
    return null
  }
}

/**
 * Berechne optimale QR-Code-Position im PDF
 */
export function calculateQRCodePosition(
  pageWidth: number = 210, // A4 width in mm
  pageHeight: number = 297, // A4 height in mm
  qrSizeInMM: number = 30,
  placement: 'flex-beside-thanks' | 'left-below-table' | 'top-right-outside-info' | 'top-right-summary' | 'bottom-right-footer' = 'flex-beside-thanks'
): { x: number; y: number; size: number; layout: 'flex' | 'grid' | 'absolute'; responsive: boolean; columnWidth?: number } {

  const contentMargin = 20 // Content margin from page edge
  const gridSpacing = 10 // Grid spacing between elements (8-12mm range)

  let x: number, y: number, layout: 'flex' | 'grid' | 'absolute' = 'grid', responsive: boolean = true, columnWidth: number = 0

  switch (placement) {
    case 'flex-beside-thanks':
      // Flex layout: QR-Code in left column (32mm) beside thanks text
      const leftColumnMargin = 18 // 16-20mm range - 18mm from left edge
      const leftColumnWidth = 32 // 32mm width for QR + subtitle column
      const textSpacing = 14 // 12-16mm spacing to text (14mm)
      const flexTableBottomY = 180 // Approximate position where table ends
      const flexRowY = flexTableBottomY - 5 // Flex row position - moved much higher (13mm up from previous)

      x = leftColumnMargin
      y = flexRowY
      layout = 'flex'
      responsive = true
      columnWidth = leftColumnWidth

      console.log('QR-Code positioned using flex layout - beside thanks text')
      break

    case 'left-below-table':
      // Position below table on the left, aligned with "Wir bedanken uns..." text
      const leftMargin = 18 // 16-20mm range - 18mm from left edge
      const gridTableBottomY = 180 // Approximate position where table ends
      const textAlignmentY = gridTableBottomY - 5 // Aligned with first line of "Wir bedanken uns..." - moved much higher

      x = leftMargin
      y = textAlignmentY
      layout = 'grid'
      responsive = true

      console.log('QR-Code positioned below table on left - aligned with thank you text')
      break

    case 'top-right-outside-info':
      // Position outside info box using grid system
      // QR-Code gets its own row above info box
      x = pageWidth - contentMargin - qrSizeInMM
      y = 35 // Top area, well above info box with grid spacing
      layout = 'grid'
      responsive = true

      console.log('QR-Code positioned using grid layout - outside info box')
      break

    case 'top-right-summary':
      // Position near the "Gesamt" (Total) section using flex alignment
      x = pageWidth - contentMargin - qrSizeInMM
      y = 120 // Around the summary/total area
      layout = 'grid'
      responsive = true
      break

    case 'bottom-right-footer':
    default:
      // Position above footer using absolute positioning (legacy)
      x = pageWidth - contentMargin - qrSizeInMM
      y = pageHeight - contentMargin - qrSizeInMM - 15
      layout = 'absolute'
      responsive = false
      break
  }

  console.log(`QR-Code position: x=${x}mm, y=${y}mm, size=${qrSizeInMM}mm, layout=${layout}, responsive=${responsive}`)

  return {
    x: x,
    y: y,
    size: qrSizeInMM,
    layout: layout,
    responsive: responsive,
    columnWidth: columnWidth > 0 ? columnWidth : undefined
  }
}

/**
 * Überprüfe auf Überlappung mit der Zusammenfassungsspalte und passe Position an
 */
export function checkSummaryColumnOverlap(
  qrX: number,
  qrY: number,
  qrSizeInMM: number,
  pageWidth: number = 210
): { hasOverlap: boolean; adjustedX?: number } {

  const summaryColumnStart = pageWidth - 60 // Summary column typically starts at 150mm
  const rightSpacing = 14 // 12-16mm spacing to text on right
  const qrRightEdge = qrX + qrSizeInMM + rightSpacing

  if (qrRightEdge > summaryColumnStart) {
    console.log('QR-Code would overlap with summary column - adjusting position')
    const adjustedX = summaryColumnStart - qrSizeInMM - rightSpacing
    return {
      hasOverlap: true,
      adjustedX: Math.max(18, adjustedX) // Ensure minimum 18mm from left
    }
  }

  return { hasOverlap: false }
}

/**
 * Überprüfe, ob QR-Code responsives Layout für schmalen Inhalt benötigt
 */
export function checkResponsiveLayout(
  pageWidth: number,
  contentWidth: number,
  qrSizeInMM: number
): { needsResponsive: boolean; layout: 'inline' | 'separate-row' } {

  const minSpacing = 8 // Minimum 8mm spacing
  const availableWidth = pageWidth - 40 // Total margins (20mm each side)
  const requiredWidth = contentWidth + qrSizeInMM + minSpacing

  if (requiredWidth > availableWidth) {
    console.log('Narrow screen detected - QR-Code will use separate row layout')
    return {
      needsResponsive: true,
      layout: 'separate-row'
    }
  }

  return {
    needsResponsive: false,
    layout: 'inline'
  }
}

/**
 * Füge QR-Code zum jsPDF-Dokument mit korrekter Positionierung und Qualität hinzu
 */
export async function addQRCodeToPDF(
  doc: any, // jsPDF instance
  paymentData: QRCodePaymentData,
  placement: 'flex-beside-thanks' | 'left-below-table' | 'top-right-outside-info' | 'top-right-summary' | 'bottom-right-footer' = 'flex-beside-thanks'
): Promise<{ success: boolean; layout?: 'flex' | 'grid' | 'absolute'; responsive?: boolean; columnWidth?: number }> {
  try {
    const qrSizeInMM = 29 // Optimized size in 28-32mm range for better scanning

    // Generate high-quality QR-Code
    const qrDataURL = await generateQRCodeForPDF(paymentData, qrSizeInMM)
    if (!qrDataURL) {
      console.warn('Failed to generate QR-Code, skipping...')
      return { success: false }
    }

    // Calculate optimal position
    const position = calculateQRCodePosition(210, 297, qrSizeInMM, placement)

    // Check for overlap with summary column (for left-based placements)
    if (placement === 'left-below-table' || placement === 'flex-beside-thanks') {
      const overlapCheck = checkSummaryColumnOverlap(position.x, position.y, qrSizeInMM, 210)
      if (overlapCheck.hasOverlap && overlapCheck.adjustedX) {
        position.x = overlapCheck.adjustedX
        console.log(`QR-Code position adjusted to avoid summary column overlap: x=${position.x}mm`)
      }
    }

    // Check if responsive layout is needed for other placements
    const responsiveCheck = checkResponsiveLayout(210, 120, qrSizeInMM) // Assume 120mm content width

    if (responsiveCheck.needsResponsive && placement === 'top-right-outside-info') {
      console.log('Using responsive layout - QR-Code in separate row')
      // Adjust position for separate row layout
      position.y = 30 // Higher position for separate row
    }

    // Add quiet zone background (pure white rectangle)
    const quietZone = 4.5 // 4.5mm quiet zone (≥4 modules as required)
    doc.setFillColor(255, 255, 255) // Pure white background - no gradients
    doc.rect(
      position.x - quietZone,
      position.y - quietZone,
      position.size + (quietZone * 2),
      position.size + (quietZone * 2),
      'F'
    )

    // Add very subtle border for better definition (optional)
    doc.setDrawColor(245, 245, 245) // Very light gray
    doc.setLineWidth(0.03) // Ultra-thin line
    doc.rect(
      position.x - quietZone,
      position.y - quietZone,
      position.size + (quietZone * 2),
      position.size + (quietZone * 2),
      'S'
    )

    // Add the QR-Code image
    doc.addImage(
      qrDataURL,
      'PNG',
      position.x,
      position.y,
      position.size,
      position.size,
      undefined,
      'FAST' // High quality rendering
    )

    // Add optimized subtitle below QR-Code - moved closer
    const labelY = position.y + position.size + 1
    doc.setFontSize(7) // Smaller, cleaner font
    doc.setTextColor(50, 50, 50) // Dark gray for better readability
    doc.setFont('helvetica', 'normal')

    // Use the specific subtitle as requested
    const subtitle1 = 'SEPA-Überweisung'
    const subtitle2 = 'QR-Code scannen'

    // Align subtitles based on layout type
    let subtitle1X: number, subtitle2X: number

    // Center both lines under the QR-Code for all placements
    const subtitle1Width = doc.getTextWidth(subtitle1)
    const subtitle2Width = doc.getTextWidth(subtitle2)
    subtitle1X = position.x + (position.size / 2) - (subtitle1Width / 2)
    subtitle2X = position.x + (position.size / 2) - (subtitle2Width / 2)

    if (placement === 'flex-beside-thanks') {
      console.log('Flex layout: Subtitles centered under QR-Code within 32mm column')
    }

    // Add the subtitles with tighter spacing
    doc.text(subtitle1, subtitle1X, labelY)
    doc.text(subtitle2, subtitle2X, labelY + 2.5) // Even tighter spacing - moved up

    console.log('QR-Code successfully added to PDF')
    return {
      success: true,
      layout: position.layout,
      responsive: position.responsive,
      columnWidth: position.columnWidth
    }

  } catch (error) {
    console.error('Error adding QR-Code to PDF:', error)
    return { success: false }
  }
}

/**
 * Validiere SEPA QR-Code-Datenformat
 */
export function validateSEPAQRData(data: string): boolean {
  const lines = data.split('\n')

  // SEPA QR-Code must have exactly 11 lines
  if (lines.length !== 11) {
    console.warn('Invalid SEPA QR-Code: Wrong number of lines', lines.length)
    return false
  }

  // Check required fields
  if (lines[0] !== 'BCD') {
    console.warn('Invalid SEPA QR-Code: Missing BCD header')
    return false
  }

  if (lines[1] !== '002') {
    console.warn('Invalid SEPA QR-Code: Wrong version')
    return false
  }

  if (lines[2] !== '1') {
    console.warn('Invalid SEPA QR-Code: Wrong character set')
    return false
  }

  if (lines[3] !== 'SCT') {
    console.warn('Invalid SEPA QR-Code: Wrong identification')
    return false
  }

  // Validate IBAN format (basic check)
  const iban = lines[6]
  if (!iban || iban.length < 15 || !iban.match(/^[A-Z]{2}\d{2}/)) {
    console.warn('Invalid SEPA QR-Code: Invalid IBAN format')
    return false
  }

  console.log('SEPA QR-Code data validation passed')
  return true
}
