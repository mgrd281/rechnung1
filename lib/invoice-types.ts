// Rechnungstypen und zugehörige Logik für das deutsche Rechnungssystem

export enum InvoiceType {
  REGULAR = 'REGULAR',           // Normale Rechnung
  CANCELLATION = 'CANCELLATION', // Stornorechnung
  REFUND = 'REFUND'              // Rückerstattungsrechnung
}

export interface InvoiceTypeConfig {
  type: InvoiceType
  prefix: string
  name: string
  description: string
  taxBehavior: 'normal' | 'reverse' | 'zero'
  numberFormat: string
  emailSubject: string
  legalText: string
}

export const INVOICE_TYPE_CONFIGS: Record<InvoiceType, InvoiceTypeConfig> = {
  [InvoiceType.REGULAR]: {
    type: InvoiceType.REGULAR,
    prefix: 'RE',
    name: 'Rechnung',
    description: 'Normale Rechnung',
    taxBehavior: 'normal',
    numberFormat: 'RE-{year}-{number}',
    emailSubject: 'Rechnung {number} von {company}',
    legalText: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.'
  },
  [InvoiceType.CANCELLATION]: {
    type: InvoiceType.CANCELLATION,
    prefix: 'ST',
    name: 'Stornorechnung',
    description: 'Stornierung einer Rechnung',
    taxBehavior: 'reverse',
    numberFormat: 'ST-{year}-{number}',
    emailSubject: 'Stornorechnung {number} für Rechnung {originalNumber}',
    legalText: 'Diese Stornorechnung hebt die ursprüngliche Rechnung vollständig auf. Bereits geleistete Zahlungen werden erstattet.'
  },
  [InvoiceType.REFUND]: {
    type: InvoiceType.REFUND,
    prefix: 'GS',
    name: 'Gutschrift',
    description: 'Rückerstattung/Gutschrift',
    taxBehavior: 'reverse',
    numberFormat: 'GS-{year}-{number}',
    emailSubject: 'Gutschrift {number} von {company}',
    legalText: 'Der Gutschriftsbetrag wird auf Ihr Konto überwiesen oder mit zukünftigen Rechnungen verrechnet.'
  }
}

export interface ExtendedInvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  originalInvoiceItemId?: string // Referenz zum ursprünglichen Rechnungsposten
}

export interface ExtendedInvoice {
  id: string
  number: string
  type: InvoiceType
  customerId: string
  customerName: string
  customerEmail: string
  customerAddress: string
  customerCity: string
  customerZip: string
  customerCountry: string
  date: string
  dueDate: string
  items: ExtendedInvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: string
  statusColor: string
  amount: string
  createdAt: string

  // Erweiterte Felder für Storno/Rückerstattung
  originalInvoiceId?: string      // Referenz zur ursprünglichen Rechnung
  originalInvoiceNumber?: string  // Nummer der ursprünglichen Rechnung
  reason?: string                 // Grund für Storno/Rückerstattung
  refundMethod?: 'bank_transfer' | 'credit_note' | 'original_payment_method'
  processingNotes?: string        // Interne Notizen
  documentKind?: string           // Typ des Dokuments (INVOICE, CREDIT_NOTE, etc.)
}

// Hilfsfunktionen für Rechnungstypen
export function getInvoiceTypeConfig(type: InvoiceType): InvoiceTypeConfig {
  return INVOICE_TYPE_CONFIGS[type]
}

export function generateInvoiceNumber(type: InvoiceType, sequenceNumber: number): string {
  const config = getInvoiceTypeConfig(type)
  const year = new Date().getFullYear()
  return config.numberFormat
    .replace('{year}', year.toString())
    .replace('{number}', sequenceNumber.toString().padStart(3, '0'))
}

export function calculateStornoAmounts(originalInvoice: ExtendedInvoice): {
  subtotal: number
  taxAmount: number
  total: number
} {
  return {
    subtotal: -originalInvoice.subtotal,
    taxAmount: -originalInvoice.taxAmount,
    total: -originalInvoice.total
  }
}

export function createStornoItems(originalItems: ExtendedInvoiceItem[]): ExtendedInvoiceItem[] {
  return originalItems.map(item => ({
    ...item,
    id: `storno-${item.id}`,
    quantity: -item.quantity,
    total: -item.total,
    originalInvoiceItemId: item.id,
    description: `STORNO: ${item.description}`
  }))
}

export function createRefundItems(
  originalItems: ExtendedInvoiceItem[],
  refundQuantities: Record<string, number>
): ExtendedInvoiceItem[] {
  return originalItems
    .filter(item => refundQuantities[item.id] && refundQuantities[item.id] > 0)
    .map(item => {
      const refundQty = refundQuantities[item.id]
      const refundTotal = (item.total / item.quantity) * refundQty

      return {
        ...item,
        id: `refund-${item.id}`,
        quantity: -refundQty,
        total: -refundTotal,
        originalInvoiceItemId: item.id,
        description: `RÜCKERSTATTUNG: ${item.description} (${refundQty} von ${item.quantity})`
      }
    })
}
