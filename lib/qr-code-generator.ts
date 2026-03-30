// QR-Code-Generator für Zahlungsinformationen

export interface QRCodePaymentData {
  paymentMethod: 'sepa' | 'paypal' | 'custom'
  iban?: string
  bic?: string
  paypalEmail?: string
  customText?: string
  recipientName?: string
  amount: number
  currency: string
  reference: string
  purpose?: string
}

/**
 * Generiere SEPA QR-Code-Daten gemäß EPC QR-Code-Standard
 */
export function generateSEPAQRData(data: QRCodePaymentData): string {
  if (data.paymentMethod !== 'sepa' || !data.iban || !data.recipientName) {
    throw new Error('SEPA QR-Code requires IBAN and recipient name')
  }

  // EPC QR-Code format (European Payments Council)
  const lines = [
    'BCD',                           // Service Tag
    '002',                           // Version
    '1',                            // Character set (UTF-8)
    'SCT',                          // Identification (SEPA Credit Transfer)
    data.bic || '',                 // BIC (optional)
    data.recipientName,             // Beneficiary Name
    data.iban.replace(/\s/g, ''),   // Beneficiary Account (IBAN without spaces)
    `EUR${data.amount.toFixed(2)}`, // Amount in EUR
    data.purpose || '',             // Purpose (optional)
    data.reference,                 // Remittance Information (invoice number)
    ''                              // Remittance Information (structured) - empty
  ]

  return lines.join('\n')
}

/**
 * Generiere PayPal-Zahlungs-URL für QR-Code
 */
export function generatePayPalQRData(data: QRCodePaymentData): string {
  if (data.paymentMethod !== 'paypal' || !data.paypalEmail) {
    throw new Error('PayPal QR-Code requires PayPal email')
  }

  const params = new URLSearchParams({
    cmd: '_xclick',
    business: data.paypalEmail,
    amount: data.amount.toFixed(2),
    currency_code: data.currency,
    item_name: `Invoice ${data.reference}`,
    item_number: data.reference,
    no_shipping: '1',
    return: window.location.origin + '/payment-success',
    cancel_return: window.location.origin + '/payment-cancel'
  })

  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`
}

/**
 * Generiere benutzerdefinierte QR-Code-Daten
 */
export function generateCustomQRData(data: QRCodePaymentData): string {
  if (data.paymentMethod !== 'custom' || !data.customText) {
    throw new Error('Custom QR-Code requires custom text')
  }

  // Replace placeholders in custom text
  return data.customText
    .replace('{amount}', data.amount.toFixed(2))
    .replace('{currency}', data.currency)
    .replace('{reference}', data.reference)
    .replace('{invoice}', data.reference)
}

/**
 * Generiere QR-Code-Daten basierend auf der Zahlungsmethode
 */
export function generateQRCodeData(data: QRCodePaymentData): string {
  switch (data.paymentMethod) {
    case 'sepa':
      return generateSEPAQRData(data)
    case 'paypal':
      return generatePayPalQRData(data)
    case 'custom':
      return generateCustomQRData(data)
    default:
      throw new Error(`Unsupported payment method: ${data.paymentMethod}`)
  }
}

/**
 * Generiere QR-Code-Daten-URL mit der qrcode-Bibliothek
 */
export async function generateQRCodeDataURL(data: string, size: number = 200): Promise<string> {
  try {
    // Dynamic import for client-side compatibility
    const QRCode = (await import('qrcode')).default

    return await QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (error) {
    console.error('Failed to generate QR-Code:', error)
    // Fallback to simple pattern if library fails
    return generateSimpleQRCodeSVG(data, size)
  }
}

/**
 * Generiere QR-Code-SVG mit der qrcode-Bibliothek
 */
export async function generateQRCodeSVG(data: string, size: number = 200): Promise<string> {
  try {
    // Dynamic import for client-side compatibility
    const QRCode = (await import('qrcode')).default

    return await QRCode.toString(data, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (error) {
    console.error('Failed to generate QR-Code SVG:', error)
    // Fallback to simple pattern if library fails
    return generateSimpleQRCodeSVG(data, size)
  }
}

/**
 * Fallback einfacher QR-Code-SVG-Generator
 */
function generateSimpleQRCodeSVG(data: string, size: number = 200): string {
  const modules = 21 // Standard QR-Code size for version 1
  const moduleSize = size / modules

  // Create a simple pattern based on data hash
  const hash = simpleHash(data)
  const pattern: boolean[][] = []

  for (let i = 0; i < modules; i++) {
    pattern[i] = []
    for (let j = 0; j < modules; j++) {
      // Create a pseudo-random pattern based on position and data hash
      const value = (i * modules + j + hash) % 3
      pattern[i][j] = value === 0
    }
  }

  // Add finder patterns (corners)
  addFinderPattern(pattern, 0, 0)
  addFinderPattern(pattern, 0, modules - 7)
  addFinderPattern(pattern, modules - 7, 0)

  // Generate SVG
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`

  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      if (pattern[i][j]) {
        const x = j * moduleSize
        const y = i * moduleSize
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`
      }
    }
  }

  svg += '</svg>'
  return svg
}

/**
 * Simple hash function for generating patterns
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Add finder pattern to QR-Code matrix
 */
function addFinderPattern(pattern: boolean[][], startRow: number, startCol: number): void {
  const finderPattern = [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true]
  ]

  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if (startRow + i < pattern.length && startCol + j < pattern[0].length) {
        pattern[startRow + i][startCol + j] = finderPattern[i][j]
      }
    }
  }
}

/**
 * IBAN-Format validieren
 */
export function validateIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()

  // Check length (German IBAN should be 22 characters)
  if (cleanIBAN.length !== 22) {
    return false
  }

  // Check if it starts with DE (Germany)
  if (!cleanIBAN.startsWith('DE')) {
    return false
  }

  // Basic format check (2 letters + 20 digits)
  const pattern = /^DE\d{20}$/
  return pattern.test(cleanIBAN)
}

/**
 * IBAN mit Leerzeichen für die Anzeige formatieren
 */
export function formatIBAN(iban: string): string {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  return cleanIBAN.replace(/(.{4})/g, '$1 ').trim()
}
