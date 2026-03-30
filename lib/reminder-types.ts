// Reminder System Types

export interface ReminderSettings {
  enabled: boolean
  schedule: ReminderSchedule[]
  defaultLanguage: 'de'
  attachPdf: boolean
  includePaymentLink: boolean
  includeQrCode: boolean
}

export interface ReminderSchedule {
  id: string
  name: string
  triggerDays: number // negative = before due, 0 = on due, positive = after due
  reminderLevel: ReminderLevel
  enabled: boolean
  channel: 'email'
  time: string // HH:MM format
  template: ReminderTemplate
}

export type ReminderLevel = 'reminder' | 'first_notice' | 'second_notice' | 'final_notice'

export interface ReminderTemplate {
  id: string
  name: string
  language: 'de'
  subject: string
  body: string
  variables: ReminderVariable[]
}

export interface ReminderVariable {
  key: string
  label: string
  description: string
  example: string
}

export interface ReminderLog {
  id: string
  invoiceId: string
  customerId: string
  reminderLevel: ReminderLevel
  scheduledDate: Date
  sentDate?: Date
  status: ReminderStatus
  channel: 'email'
  recipient: string
  subject: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled' | 'skipped'

export interface ReminderQueue {
  id: string
  invoiceId: string
  scheduleId: string
  scheduledDate: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  lastAttempt?: Date
  nextAttempt?: Date
  errorMessage?: string
}

// Default reminder variables
export const REMINDER_VARIABLES: ReminderVariable[] = [
  {
    key: 'invoice_number',
    label: 'Rechnungsnummer',
    description: 'Die eindeutige Rechnungsnummer',
    example: 'RE-2024-001'
  },
  {
    key: 'invoice_date',
    label: 'Rechnungsdatum',
    description: 'Das Datum der Rechnungsstellung',
    example: '15.03.2024'
  },
  {
    key: 'due_date',
    label: 'Fälligkeitsdatum',
    description: 'Das Datum, bis wann die Rechnung bezahlt werden soll',
    example: '29.03.2024'
  },
  {
    key: 'customer_name',
    label: 'Kundenname',
    description: 'Der vollständige Name des Kunden',
    example: 'Max Mustermann'
  },
  {
    key: 'customer_company',
    label: 'Kundenfirma',
    description: 'Der Firmenname des Kunden',
    example: 'Mustermann GmbH'
  },
  {
    key: 'total_amount',
    label: 'Gesamtbetrag',
    description: 'Der Gesamtbetrag der Rechnung',
    example: '1.190,00 €'
  },
  {
    key: 'open_amount',
    label: 'Offener Betrag',
    description: 'Der noch zu zahlende Betrag',
    example: '1.190,00 €'
  },
  {
    key: 'company_name',
    label: 'Firmenname',
    description: 'Der Name Ihres Unternehmens',
    example: 'Ihre Firma GmbH'
  },
  {
    key: 'payment_link',
    label: 'Zahlungslink',
    description: 'Link zur Online-Zahlung',
    example: 'https://pay.example.com/invoice/123'
  },
  {
    key: 'iban',
    label: 'IBAN',
    description: 'Ihre Bankverbindung für Überweisungen',
    example: 'DE89 3704 0044 0532 0130 00'
  },
  {
    key: 'days_overdue',
    label: 'Tage überfällig',
    description: 'Anzahl der Tage seit Fälligkeit',
    example: '7'
  }
]

// Default reminder templates
export const DEFAULT_REMINDER_TEMPLATES: Record<ReminderLevel, ReminderTemplate> = {
  reminder: {
    id: 'reminder_de',
    name: 'Freundliche Erinnerung',
    language: 'de',
    subject: 'Freundliche Erinnerung - Rechnung {{invoice_number}}',
    body: `Sehr geehrte/r {{customer_name}},

wir möchten Sie freundlich daran erinnern, dass die Rechnung {{invoice_number}} vom {{invoice_date}} am {{due_date}} fällig wird.

Rechnungsdetails:
- Rechnungsnummer: {{invoice_number}}
- Rechnungsdatum: {{invoice_date}}
- Fälligkeitsdatum: {{due_date}}
- Gesamtbetrag: {{total_amount}}

Falls Sie die Rechnung bereits beglichen haben, betrachten Sie diese E-Mail als gegenstandslos.

Bitte überweisen Sie den Gesamtbetrag Ihrer Bestellung auf folgendes Konto:

Empfänger: Karina Khrystych
IBAN: DE22 1001 1001 2087 5043 11
BIC: NTSBDEB1XXX
Bankname: N26
Verwendungszweck: {{invoice_number}}

Sobald die Zahlung bei uns eingegangen ist, wird Ihre Bestellung umgehend versendet.

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.
Besuchen Sie auch unseren Shop: https://www.karinex.de

Mit freundlichen Grüßen
{{company_name}}`,
    variables: REMINDER_VARIABLES
  },
  first_notice: {
    id: 'first_notice_de',
    name: '1. Mahnung',
    language: 'de',
    subject: '1. Mahnung - Rechnung {{invoice_number}} überfällig',
    body: `Sehr geehrte/r {{customer_name}},

unsere Rechnung {{invoice_number}} vom {{invoice_date}} ist seit {{days_overdue}} Tagen überfällig.

Rechnungsdetails:
- Rechnungsnummer: {{invoice_number}}
- Rechnungsdatum: {{invoice_date}}
- Fälligkeitsdatum: {{due_date}}
- Offener Betrag: {{open_amount}}

Bitte begleichen Sie den ausstehenden Betrag umgehend.

Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto:

Empfänger: Karina Khrystych
IBAN: DE22 1001 1001 2087 5043 11
BIC: NTSBDEB1XXX
Bankname: N26
Verwendungszweck: {{invoice_number}}

Sobald die Zahlung bei uns eingegangen ist, wird Ihre Bestellung umgehend versendet.

Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese Mahnung als gegenstandslos.

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.
Besuchen Sie auch unseren Shop: https://www.karinex.de

Mit freundlichen Grüßen
{{company_name}}`,
    variables: REMINDER_VARIABLES
  },
  second_notice: {
    id: 'second_notice_de',
    name: '2. Mahnung',
    language: 'de',
    subject: '2. Mahnung - Rechnung {{invoice_number}} - Sofortige Zahlung erforderlich',
    body: `Sehr geehrte/r {{customer_name}},

trotz unserer ersten Mahnung ist die Rechnung {{invoice_number}} vom {{invoice_date}} weiterhin unbezahlt.

Die Rechnung ist seit {{days_overdue}} Tagen überfällig.

Rechnungsdetails:
- Rechnungsnummer: {{invoice_number}}
- Rechnungsdatum: {{invoice_date}}
- Fälligkeitsdatum: {{due_date}}
- Offener Betrag: {{open_amount}}

Wir fordern Sie hiermit auf, den Betrag innerhalb von 7 Tagen zu begleichen.

Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto:

Empfänger: Karina Khrystych
IBAN: DE22 1001 1001 2087 5043 11
BIC: NTSBDEB1XXX
Bankname: N26
Verwendungszweck: {{invoice_number}}

Sobald die Zahlung bei uns eingegangen ist, wird Ihre Bestellung umgehend versendet.

Bei ausbleibender Zahlung behalten wir uns weitere rechtliche Schritte vor.

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.
Besuchen Sie auch unseren Shop: https://www.karinex.de

Mit freundlichen Grüßen
{{company_name}}`,
    variables: REMINDER_VARIABLES
  },
  final_notice: {
    id: 'final_notice_de',
    name: 'Letzte Mahnung',
    language: 'de',
    subject: 'LETZTE MAHNUNG - Rechnung {{invoice_number}} - Rechtliche Schritte',
    body: `Sehr geehrte/r {{customer_name}},

dies ist unsere letzte Mahnung für die überfällige Rechnung {{invoice_number}}.

Die Rechnung ist seit {{days_overdue}} Tagen überfällig.

Rechnungsdetails:
- Rechnungsnummer: {{invoice_number}}
- Rechnungsdatum: {{invoice_date}}
- Fälligkeitsdatum: {{due_date}}
- Offener Betrag: {{open_amount}}

LETZTE ZAHLUNGSFRIST: 3 Tage ab Erhalt dieser Mahnung

Bitte überweisen Sie den Gesamtbetrag SOFORT auf folgendes Konto:

Empfänger: Karina Khrystych
IBAN: DE22 1001 1001 2087 5043 11
BIC: NTSBDEB1XXX
Bankname: N26
Verwendungszweck: {{invoice_number}}

Bei ausbleibender Zahlung werden wir ohne weitere Ankündigung rechtliche Schritte einleiten und ein Inkassoverfahren beauftragen.

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.
Besuchen Sie auch unseren Shop: https://www.karinex.de

{{company_name}}`,
    variables: REMINDER_VARIABLES
  }
}

// Default reminder schedule
export const DEFAULT_REMINDER_SCHEDULE: ReminderSchedule[] = [
  {
    id: 'pre_due_reminder',
    name: 'Erinnerung vor Fälligkeit',
    triggerDays: -3,
    reminderLevel: 'reminder',
    enabled: true,
    channel: 'email',
    time: '09:00',
    template: DEFAULT_REMINDER_TEMPLATES.reminder
  },
  {
    id: 'due_date_reminder',
    name: 'Erinnerung am Fälligkeitstag',
    triggerDays: 0,
    reminderLevel: 'reminder',
    enabled: true,
    channel: 'email',
    time: '10:00',
    template: DEFAULT_REMINDER_TEMPLATES.reminder
  },
  {
    id: 'first_notice',
    name: '1. Mahnung (+7 Tage)',
    triggerDays: 7,
    reminderLevel: 'first_notice',
    enabled: true,
    channel: 'email',
    time: '09:00',
    template: DEFAULT_REMINDER_TEMPLATES.first_notice
  },
  {
    id: 'second_notice',
    name: '2. Mahnung (+14 Tage)',
    triggerDays: 14,
    reminderLevel: 'second_notice',
    enabled: true,
    channel: 'email',
    time: '09:00',
    template: DEFAULT_REMINDER_TEMPLATES.second_notice
  },
  {
    id: 'final_notice',
    name: 'Letzte Mahnung (+30 Tage)',
    triggerDays: 30,
    reminderLevel: 'final_notice',
    enabled: true,
    channel: 'email',
    time: '09:00',
    template: DEFAULT_REMINDER_TEMPLATES.final_notice
  }
]

// Default reminder settings
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  schedule: DEFAULT_REMINDER_SCHEDULE,
  defaultLanguage: 'de',
  attachPdf: true,
  includePaymentLink: true,
  includeQrCode: false
}
