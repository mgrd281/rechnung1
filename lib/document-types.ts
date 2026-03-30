// Document Types and Status Definitions
export enum DocumentKind {
  INVOICE = 'INVOICE',           // Rechnung
  CANCELLATION = 'CANCELLATION', // Stornorechnung  
  CREDIT_NOTE = 'CREDIT_NOTE',   // Gutschrift (Legacy/Generic)
  REFUND_FULL = 'REFUND_FULL',   // Gutschrift für volle Rückerstattung
  REFUND_PARTIAL = 'REFUND_PARTIAL', // Gutschrift für teilweise Rückerstattung
  DUNNING_1 = 'DUNNING_1',       // Mahnung 1
  DUNNING_2 = 'DUNNING_2',       // Mahnung 2
  DUNNING_3 = 'DUNNING_3'        // Mahnung 3
}

export enum DocumentStatus {
  BEZAHLT = 'Bezahlt',                    // Paid
  OFFEN = 'Offen',                        // Open
  TEILWEISE_BEZAHLT = 'Teilweise bezahlt', // Partially paid
  UEBERFAELLIG = 'Überfällig',            // Overdue
  STORNIERT = 'Storniert',                // Cancelled
  GUTSCHRIFT = 'Gutschrift'               // Credit note processed
}

export interface DocumentData {
  id: string

  // Document identification
  document_kind: DocumentKind
  document_number: string        // RE-2024-001, ST-2024-001, GS-2024-001
  reference_number?: string      // Original invoice number for Storno/Gutschrift

  // Customer information
  customerId: string
  customerName: string
  customerEmail: string
  customerAddress: string
  customerCity: string
  customerZip: string
  customerCountry: string

  // Document dates
  date: string
  dueDate?: string              // Only for INVOICE

  // Financial data with correct signs
  items: DocumentItem[]
  subtotal: number              // Signed value (negative for Storno/Gutschrift)
  taxRate: number
  taxAmount: number             // Signed value
  total: number                 // Signed value
  totals_signed: boolean        // Flag indicating if totals have correct signs

  // Status (separate from document kind)
  status: DocumentStatus
  statusColor: string

  // Additional fields
  grund?: string                // Reason for Storno/Gutschrift
  amount: string                // Formatted amount string
  createdAt: string
  shopifyOrderNumber?: string
}

export interface DocumentItem {
  id: string
  description: string
  quantity: number
  unitPrice: number             // Signed value
  total: number                 // Signed value
}

// Helper functions
export function getDocumentPrefix(kind: DocumentKind): string {
  switch (kind) {
    case DocumentKind.INVOICE:
      return 'RE'
    case DocumentKind.CANCELLATION:
      return 'ST'
    case DocumentKind.CREDIT_NOTE:
    case DocumentKind.REFUND_FULL:
    case DocumentKind.REFUND_PARTIAL:
      return 'GS'
    default:
      return 'RE'
  }
}

export function getDocumentTitle(kind: DocumentKind): string {
  switch (kind) {
    case DocumentKind.INVOICE:
      return 'RECHNUNG'
    case DocumentKind.CANCELLATION:
      return 'STORNO-RECHNUNG'
    case DocumentKind.CREDIT_NOTE:
    case DocumentKind.REFUND_FULL:
    case DocumentKind.REFUND_PARTIAL:
      return 'GUTSCHRIFT'
    default:
      return 'RECHNUNG'
  }
}

export function getDocumentColor(kind: DocumentKind): { r: number, g: number, b: number } {
  switch (kind) {
    case DocumentKind.INVOICE:
      return { r: 37, g: 99, b: 235 }    // Blue
    case DocumentKind.CANCELLATION:
      return { r: 220, g: 38, b: 38 }    // Red
    case DocumentKind.CREDIT_NOTE:
    case DocumentKind.REFUND_FULL:
    case DocumentKind.REFUND_PARTIAL:
      return { r: 37, g: 99, b: 235 }    // Blue (Refunds are usually blue or green, keeping blue for consistency)
    default:
      return { r: 37, g: 99, b: 235 }
  }
}

export function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.BEZAHLT:
      return 'bg-green-100 text-green-800'
    case DocumentStatus.OFFEN:
      return 'bg-yellow-100 text-yellow-800'
    case DocumentStatus.TEILWEISE_BEZAHLT:
      return 'bg-orange-100 text-orange-800'
    case DocumentStatus.UEBERFAELLIG:
      return 'bg-red-100 text-red-800'
    case DocumentStatus.STORNIERT:
      return 'bg-red-100 text-red-800'
    case DocumentStatus.GUTSCHRIFT:
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function determineDocumentKind(csvData: any): DocumentKind {
  const rechnungstyp = csvData.rechnungstyp?.toLowerCase() || ''
  const orderNumber = csvData.orderNumber || ''
  const total = parseFloat(csvData.total || '0')
  const financialStatus = csvData.financialStatus?.toLowerCase() || ''

  // Check explicit type column
  if (rechnungstyp === 'storno') {
    return DocumentKind.CANCELLATION
  }
  if (rechnungstyp === 'gutschrift') {
    return DocumentKind.CREDIT_NOTE
  }

  // Check by order number prefix
  if (orderNumber.startsWith('ST-')) {
    return DocumentKind.CANCELLATION
  }
  if (orderNumber.startsWith('GS-')) {
    return DocumentKind.CREDIT_NOTE
  }

  // Check financial status
  if (financialStatus === 'refunded') {
    return DocumentKind.REFUND_FULL
  }
  if (financialStatus === 'partially_refunded') {
    return DocumentKind.REFUND_PARTIAL
  }

  // Check by negative amount (fallback)
  if (total < 0) {
    // If negative but no explicit type, assume credit note
    return DocumentKind.CREDIT_NOTE
  }

  return DocumentKind.INVOICE
}

export function determineDocumentStatus(csvData: any, kind: DocumentKind): DocumentStatus {
  const statusDeutsch = csvData.statusDeutsch || ''
  const financialStatus = csvData.financialStatus?.toLowerCase() || ''

  // Use explicit German status if available
  if (statusDeutsch) {
    switch (statusDeutsch.toLowerCase()) {
      case 'bezahlt':
        return DocumentStatus.BEZAHLT
      case 'offen':
        return DocumentStatus.OFFEN
      case 'teilweise bezahlt':
        return DocumentStatus.TEILWEISE_BEZAHLT
      case 'überfällig':
        return DocumentStatus.UEBERFAELLIG
      case 'storniert':
        return DocumentStatus.STORNIERT
      case 'gutschrift':
        return DocumentStatus.GUTSCHRIFT
    }
  }

  // Map from financial status
  switch (financialStatus) {
    case 'paid':
      return DocumentStatus.BEZAHLT
    case 'pending':
      return DocumentStatus.OFFEN
    case 'partial':
    case 'partially_paid':
      return DocumentStatus.TEILWEISE_BEZAHLT
    case 'authorized':
      return DocumentStatus.OFFEN
    case 'refunded':
      return kind === DocumentKind.CANCELLATION ? DocumentStatus.STORNIERT : DocumentStatus.GUTSCHRIFT
    case 'partially_refunded':
      return DocumentStatus.GUTSCHRIFT
    case 'voided':
      return DocumentStatus.STORNIERT
    default:
      // Default based on document kind
      if (kind === DocumentKind.CANCELLATION) {
        return DocumentStatus.STORNIERT
      } else if (kind === DocumentKind.CREDIT_NOTE) {
        return DocumentStatus.GUTSCHRIFT
      } else {
        return DocumentStatus.OFFEN
      }
  }
}
