// Invoice Template System
// Allows different templates for different invoice types with customizable texts

export interface InvoiceTemplate {
  id: string
  name: string
  type: 'offen' | 'bezahlt' | 'storniert' | 'promo' | 'erstattet' | 'custom' | 'storno' | 'zahlungsbeleg' | 'teilerstattung' | 'vollerstattung' | 'rechnung'
  isDefault: boolean

  // Static texts that change per template (same design, different content)
  texts: {
    title: string                    // Invoice title: "Offene Rechnung", "Bezahlte Rechnung", etc.
    subtitle?: string               // Explanatory text under title
    paymentNote?: string            // Payment instructions
    footerNote?: string             // Footer signature/text
    thankYouNote?: string           // Thank you message
    legalNote?: string              // Legal disclaimer
  }

  // Bank details (can be different per template)
  bankDetails?: {
    bankName: string
    iban: string
    bic: string
    accountHolder: string
  }

  // Default invoice settings when using this template
  defaults: {
    status: 'Offen' | 'Bezahlt' | 'Storniert' | 'Erstattet' | 'Gutschrift' | 'Mahnung'  // Default status
    dueDays: number                 // Default due days (optional)
    taxRate: number                 // Default tax rate (optional)
    showBankDetails: boolean        // Show bank info
    showPaymentInstructions: boolean // Show payment notes
  }

  // New settings and styling fields
  settings?: {
    showBankDetails: boolean
    showPaymentInstructions: boolean
    showDueDate: boolean
    showTaxInfo: boolean
    highlightTotal: boolean
  }

  styling?: {
    primaryColor: string
    secondaryColor: string
    textColor: string
    backgroundColor: string
  }

  layout?: {
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

  createdAt: string
  updatedAt: string
  customHtml?: string                // Optional custom HTML template
}

// Default templates for different invoice types
export const DEFAULT_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'template-offen',
    name: 'Offene Rechnung - Zahlungsaufforderung',
    type: 'offen',
    isDefault: false,
    texts: {
      title: 'Offene Rechnung',
      subtitle: 'Bitte begleichen Sie den Betrag vor dem Fälligkeitsdatum.',
      paymentNote: 'Bitte überweisen Sie den Betrag vor dem Fälligkeitsdatum auf das unten angegebene Bankkonto.',
      footerNote: 'Vielen Dank für Ihr Vertrauen.',
      thankYouNote: 'Vielen Dank für die Zusammenarbeit.',
      legalNote: 'Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.'
    },
    defaults: {
      status: 'Offen',
      dueDays: 14,
      taxRate: 19,
      showBankDetails: true,
      showPaymentInstructions: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  {
    id: 'template-bezahlt',
    name: 'Bezahlte Rechnung - Zahlungseingang bestätigt',
    type: 'bezahlt',
    isDefault: true,
    texts: {
      title: 'Bezahlte Rechnung',
      subtitle: 'Diese Rechnung ist vollständig bezahlt. Vielen Dank!',
      paymentNote: 'Der Betrag wurde vollständig erhalten.',
      footerNote: 'Vielen Dank für Ihre pünktliche Zahlung.',
      thankYouNote: 'Wir schätzen Ihre pünktliche Zahlung.',
      legalNote: 'Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.'
    },
    defaults: {
      status: 'Bezahlt',
      dueDays: 0,
      taxRate: 19,
      showBankDetails: false,
      showPaymentInstructions: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  {
    id: 'template-storniert',
    name: 'Stornierte Rechnung - Rechnung ungültig',
    type: 'storniert',
    isDefault: false,
    texts: {
      title: 'Stornierte Rechnung',
      subtitle: 'Diese Rechnung wurde storniert und ist ungültig.',
      paymentNote: 'Achtung: Diese Rechnung ist storniert und nicht zur Zahlung gültig.',
      footerNote: 'Bei Fragen wenden Sie sich bitte an den Kundenservice.',
      thankYouNote: 'Wir entschuldigen uns für etwaige Unannehmlichkeiten.',
      legalNote: 'Dies ist eine elektronisch erstellte Stornorechnung.'
    },
    defaults: {
      status: 'Storniert',
      dueDays: 0,
      taxRate: 19,
      showBankDetails: false,
      showPaymentInstructions: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  {
    id: 'template-promo',
    name: 'Promo Rechnung - Sonderangebot mit Rabatt',
    type: 'promo',
    isDefault: false,
    texts: {
      title: 'Aktionsrechnung',
      subtitle: 'Sonderangebot/Rabatt – Preise gemäß Kampagne reduziert.',
      paymentNote: 'Dies ist eine Rechnung mit Sonderpreisen. Bitte zahlen Sie vor Ablauf des Angebots.',
      footerNote: 'Vielen Dank, dass Sie unsere Sonderangebote nutzen.',
      thankYouNote: 'Vielen Dank, dass Sie unsere Aktionsangebote gewählt haben.',
      legalNote: 'Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.'
    },
    defaults: {
      status: 'Offen',
      dueDays: 14,
      taxRate: 19,
      showBankDetails: true,
      showPaymentInstructions: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  {
    id: 'template-erstattet',
    name: 'Gutschrift - Rückerstattung',
    type: 'erstattet',
    isDefault: false,
    texts: {
      title: 'Gutschrift',
      subtitle: 'Betrag erstattet – Dokument nur zur Information.',
      paymentNote: 'Der Betrag wurde auf Ihr Bankkonto zurückerstattet.',
      footerNote: 'Vielen Dank für Ihr Verständnis.',
      thankYouNote: 'Wir entschuldigen uns für etwaige Unannehmlichkeiten und danken für Ihr Verständnis.',
      legalNote: 'Dies ist eine elektronisch erstellte Erstattungsrechnung und ohne Unterschrift gültig.'
    },
    bankDetails: {
      bankName: 'Ihre Bank',
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'COBADEFFXXX',
      accountHolder: 'Ihr Unternehmen'
    },
    defaults: {
      status: 'Gutschrift',
      dueDays: 0,
      taxRate: 19,
      showBankDetails: true,
      showPaymentInstructions: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'template-storno',
    name: 'إلغاء فاتورة (Storno)',
    type: 'storno',
    isDefault: false,
    texts: {
      title: 'Stornorechnung',
      subtitle: 'هذه الفاتورة ملغاة وغير صالحة للدفع.',
      paymentNote: 'Invoice cancelled.',
      footerNote: 'تم إلغاء الفاتورة بنجاح.',
      thankYouNote: 'تم الاستلام.',
      legalNote: 'Dokument gültig ohne Unterschrift.'
    },
    defaults: {
      status: 'Storniert',
      dueDays: 0,
      taxRate: 19,
      showBankDetails: false,
      showPaymentInstructions: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'template-zahlungsbeleg',
    name: 'فاتورة دفع (Zahlungsbeleg)',
    type: 'zahlungsbeleg',
    isDefault: false,
    texts: {
      title: 'Zahlungsbeleg',
      subtitle: 'لقد استلمنا دفعتكم. شكراً لكم!',
      paymentNote: 'Payment confirmed.',
      footerNote: 'شكراً لتعاملكم معنا.',
      thankYouNote: 'Zahlung bestätigt.',
      legalNote: 'Zahlungsnachweis.'
    },
    defaults: {
      status: 'Bezahlt',
      dueDays: 0,
      taxRate: 19,
      showBankDetails: false,
      showPaymentInstructions: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'template-teilerstattung',
    name: 'استرداد جزئي (Teilerstattung)',
    type: 'teilerstattung',
    isDefault: false,
    texts: {
      title: 'Teilerstattung',
      subtitle: 'تم استرداد جزء من المبلغ.',
      paymentNote: 'Partial refund processed.',
      footerNote: 'سيصلك المبلغ خلال أيام.',
      thankYouNote: 'Teilerstattung erfolgt.',
      legalNote: 'Refund notice.'
    },
    defaults: {
      status: 'Erstattet',
      dueDays: 0,
      taxRate: 19,
      showBankDetails: false,
      showPaymentInstructions: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

import { prisma } from './prisma'
import { ensureOrganization } from './db-operations'

// Template management functions (Async)
export async function getAllTemplates(): Promise<InvoiceTemplate[]> {
  const dbTemplates = await prisma.invoiceTemplate.findMany()

  const mappedDbTemplates = dbTemplates.map(db => {
    const settings = db.settings as any || {}
    return {
      id: db.id,
      name: db.name,
      type: (settings.type || 'rechnung') as any,
      isDefault: db.isDefault,
      texts: settings.texts || {},
      bankDetails: settings.bankDetails,
      defaults: settings.defaults || { status: 'Offen', dueDays: 14, taxRate: 19, showBankDetails: true, showPaymentInstructions: true },
      settings: settings.settings || {
        showBankDetails: true, showPaymentInstructions: true, showDueDate: true, showTaxInfo: true, highlightTotal: true
      },
      styling: settings.styling || {
        primaryColor: '#5B8272', secondaryColor: '#6b7280', textColor: '#000000', backgroundColor: '#ffffff'
      },
      layout: settings.layout || {},
      customHtml: db.htmlContent,
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString()
    } as InvoiceTemplate
  })

  // Combine defaults with DB templates, avoiding duplicates by ID
  const dbIds = new Set(mappedDbTemplates.map(t => t.id))
  const filteredDefaults = DEFAULT_TEMPLATES.filter(t => !dbIds.has(t.id))

  return [...filteredDefaults, ...mappedDbTemplates]
}

export async function getTemplateById(id: string): Promise<InvoiceTemplate | null> {
  // Check DB first
  const db = await prisma.invoiceTemplate.findUnique({ where: { id } })
  if (db) {
    const settings = db.settings as any || {}
    return {
      id: db.id,
      name: db.name,
      type: (settings.type || 'rechnung') as any,
      isDefault: db.isDefault,
      texts: settings.texts || {},
      bankDetails: settings.bankDetails,
      defaults: settings.defaults || { status: 'Offen', dueDays: 14, taxRate: 19, showBankDetails: true, showPaymentInstructions: true },
      settings: settings.settings || {
        showBankDetails: true, showPaymentInstructions: true, showDueDate: true, showTaxInfo: true, highlightTotal: true
      },
      styling: settings.styling || {
        primaryColor: '#5B8272', secondaryColor: '#6b7280', textColor: '#000000', backgroundColor: '#ffffff'
      },
      layout: settings.layout || {},
      customHtml: db.htmlContent,
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString()
    }
  }

  // Fallback to defaults
  return DEFAULT_TEMPLATES.find(t => t.id === id) || null
}

export async function saveTemplate(template: InvoiceTemplate): Promise<void> {
  // Ensure organization exists first to avoid FK errors
  const org = await ensureOrganization()
  const organizationId = org.id

  const config = {
    type: template.type,
    texts: template.texts,
    bankDetails: template.bankDetails,
    defaults: template.defaults,
    settings: template.settings,
    styling: template.styling,
    layout: template.layout
  }

  await prisma.invoiceTemplate.upsert({
    where: { id: template.id },
    update: {
      name: template.name,
      htmlContent: template.customHtml || '',
      isDefault: template.isDefault,
      settings: config as any,
      updatedAt: new Date()
    },
    create: {
      id: template.id,
      organizationId,
      name: template.name,
      htmlContent: template.customHtml || '',
      cssContent: '',
      isDefault: template.isDefault,
      settings: config as any,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const template = await getTemplateById(id)
  if (!template || template.isDefault) return false

  // Only allowed to delete from DB
  try {
    await prisma.invoiceTemplate.delete({ where: { id } })
    return true
  } catch (e) {
    return false
  }
}

export async function setDefaultTemplate(id: string): Promise<void> {
  await prisma.invoiceTemplate.updateMany({
    where: { isDefault: true },
    data: { isDefault: false }
  })

  await prisma.invoiceTemplate.update({
    where: { id },
    data: { isDefault: true }
  })
}

export function generateTemplateId(): string {
  return `template-${Date.now()}`
}
