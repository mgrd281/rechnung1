// Document Templates System - Extended beyond invoices
// Supports multiple document types with their own templates

export type DocumentType = 'invoice' | 'receipt' | 'payment_notice' | 'reminder' | 'quote' | 'delivery_note'

export interface DocumentTemplate {
  id: string
  name: string
  type: DocumentType
  category: 'financial' | 'commercial' | 'administrative'
  isDefault: boolean

  // Document-specific content
  content: {
    title: string                    // Document title
    subtitle?: string               // Explanatory text under title
    headerNote?: string             // Note at the top
    bodyText?: string               // Main content text
    footerNote?: string             // Footer signature/text
    thankYouNote?: string           // Thank you message
    legalNote?: string              // Legal disclaimer
    instructionsText?: string       // Instructions for recipient
  }

  // Document behavior settings
  settings: {
    showBankDetails: boolean        // Show bank information
    showPaymentInstructions: boolean // Show payment notes
    showItemsTable: boolean         // Show items/services table
    showTotals: boolean             // Show calculation totals
    showDueDate: boolean            // Show due date
    showTaxInfo: boolean            // Show tax information
    requireSignature: boolean       // Require recipient signature
    allowPartialPayment: boolean    // Allow partial payments
  }

  // Visual styling (consistent across all documents)
  styling: {
    primaryColor: string
    secondaryColor: string
    textColor: string
    backgroundColor: string
  }

  createdAt: string
  updatedAt: string
}

// Receipt/Payment Received Notice Templates
export const RECEIPT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'receipt-full-payment',
    name: 'Vollständige Zahlung erhalten',
    type: 'receipt',
    category: 'financial',
    isDefault: true,
    content: {
      title: 'Zahlungseingangsbestätigung',
      subtitle: 'Vollständiger Betrag erfolgreich erhalten',
      headerNote: 'Vielen Dank für Ihre pünktliche Zahlung',
      bodyText: 'Wir bestätigen den vollständigen Erhalt des unten aufgeführten Betrags für die erbrachten Leistungen/Produkte.',
      footerNote: 'Wir schätzen Ihr Vertrauen und freuen uns auf die weitere Zusammenarbeit.',
      thankYouNote: 'Vielen Dank, dass Sie sich für unsere Dienste entschieden haben.',
      legalNote: 'Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.',
      instructionsText: 'Bitte bewahren Sie diesen Beleg als Zahlungsnachweis auf.'
    },
    settings: {
      showBankDetails: false,         // No need for bank details in receipt
      showPaymentInstructions: false, // Payment already received
      showItemsTable: true,           // Show what was paid for
      showTotals: true,               // Show payment amounts
      showDueDate: false,             // Not applicable for receipts
      showTaxInfo: true,              // Show tax breakdown
      requireSignature: false,        // Optional for receipts
      allowPartialPayment: false      // Full payment received
    },
    styling: {
      primaryColor: '#10b981',        // Green for success/received
      secondaryColor: '#6b7280',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  {
    id: 'receipt-partial-payment',
    name: 'Teilzahlung erhalten',
    type: 'receipt',
    category: 'financial',
    isDefault: false,
    content: {
      title: 'Teilzahlungsbestätigung',
      subtitle: 'Teilbetrag erhalten',
      headerNote: 'Vielen Dank für Ihre Teilzahlung',
      bodyText: 'Wir bestätigen den Erhalt der unten aufgeführten Teilzahlung. Der Restbetrag ist gemäß Vereinbarung fällig.',
      footerNote: 'Bitte begleichen Sie den Restbetrag fristgerecht.',
      thankYouNote: 'Vielen Dank für Ihre Zahlung.',
      legalNote: 'Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.',
      instructionsText: 'Der Restbetrag ist fällig. Sie erhalten eine separate Rechnung über den verbleibenden Betrag.'
    },
    settings: {
      showBankDetails: true,          // Show for remaining payment
      showPaymentInstructions: true,  // Instructions for remaining amount
      showItemsTable: true,           // Show what was partially paid
      showTotals: true,               // Show paid vs remaining
      showDueDate: true,              // Due date for remaining amount
      showTaxInfo: true,              // Tax breakdown
      requireSignature: false,        // Optional
      allowPartialPayment: true       // This IS a partial payment
    },
    styling: {
      primaryColor: '#f59e0b',        // Orange for partial/pending
      secondaryColor: '#6b7280',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  {
    id: 'receipt-advance-payment',
    name: 'Anzahlung erhalten',
    type: 'receipt',
    category: 'financial',
    isDefault: false,
    content: {
      title: 'Anzahlungsbestätigung',
      subtitle: 'Anzahlung erfolgreich erhalten',
      headerNote: 'Vielen Dank für Ihre Anzahlung',
      bodyText: 'Wir bestätigen den Erhalt der unten aufgeführten Anzahlung. Dieser Betrag wird von der Endrechnung abgezogen.',
      footerNote: 'Die Endrechnung wird nach Abschluss der Leistung/Lieferung erstellt.',
      thankYouNote: 'Vielen Dank für Ihr Vertrauen.',
      legalNote: 'Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.',
      instructionsText: 'Dies ist eine Anzahlung. Die Endrechnung wird diesen Betrag berücksichtigen.'
    },
    settings: {
      showBankDetails: false,         // Payment already received
      showPaymentInstructions: false, // No additional payment needed now
      showItemsTable: true,           // Show what advance is for
      showTotals: true,               // Show advance amount
      showDueDate: false,             // Not applicable for advance
      showTaxInfo: false,             // Tax calculated in final invoice
      requireSignature: true,         // Important for advance payments
      allowPartialPayment: false      // This IS the partial payment
    },
    styling: {
      primaryColor: '#3b82f6',        // Blue for advance/future
      secondaryColor: '#6b7280',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Document management functions
export function getAllDocumentTemplates(): DocumentTemplate[] {
  return [...RECEIPT_TEMPLATES]
}

export function getTemplatesByType(type: DocumentType): DocumentTemplate[] {
  return getAllDocumentTemplates().filter(template => template.type === type)
}

export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return getAllDocumentTemplates().filter(template => template.category === category)
}

export function getTemplateById(id: string): DocumentTemplate | null {
  return getAllDocumentTemplates().find(template => template.id === id) || null
}

export function getDefaultTemplate(type: DocumentType): DocumentTemplate | null {
  return getTemplatesByType(type).find(template => template.isDefault) || null
}

// Helper functions for document generation
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    'invoice': 'Rechnung',
    'receipt': 'Empfangsbestätigung',
    'payment_notice': 'Zahlungshinweis',
    'reminder': 'Mahnung',
    'quote': 'Angebot',
    'delivery_note': 'Lieferschein'
  }
  return labels[type] || type
}

export function getDocumentCategoryLabel(category: DocumentTemplate['category']): string {
  const labels: Record<DocumentTemplate['category'], string> = {
    'financial': 'Finanziell',
    'commercial': 'Kommerziell',
    'administrative': 'Administrativ'
  }
  return labels[category] || category
}
