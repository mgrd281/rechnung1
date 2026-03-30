// Accounting System Types and Interfaces
// Buchhaltungssystem - Typen und Schnittstellen

export type AccountingPeriod = 'month' | 'quarter' | 'year' | 'all' | 'custom'
export type InvoiceStatus = 'offen' | 'bezahlt' | 'erstattet' | 'storniert' | 'überfällig'
export type ExpenseCategory = 'office' | 'travel' | 'equipment' | 'marketing' | 'utilities' | 'professional_services' | 'other'
export type ExportFormat = 'csv' | 'pdf' | 'datev' | 'excel' | 'zip'

export interface AccountingFilter {
  period: AccountingPeriod
  startDate?: string
  endDate?: string
  status?: InvoiceStatus[]
  customerIds?: string[]
  minAmount?: number
  maxAmount?: number
}

export interface AccountingSummary {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalTax: number
  vatCollected: number
  vatPaid: number

  // Breakdown by status
  openInvoices: {
    count: number
    amount: number
  }
  paidInvoices: {
    count: number
    amount: number
  }
  refundedInvoices: {
    count: number
    amount: number
  }
  cancelledInvoices: {
    count: number
    amount: number
  }
  overdueInvoices: {
    count: number
    amount: number
  }
}

export interface AccountingInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerTaxId?: string
  date: string
  dueDate: string
  status: InvoiceStatus
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  paidDate?: string
  category: string
  description: string

  // DATEV specific fields
  accountingAccount?: string
  costCenter?: string
  bookingText?: string
}

export interface Expense {
  id: string
  expenseNumber: string
  date: string
  category: ExpenseCategory
  description: string
  supplier: string
  supplierTaxId?: string
  netAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  receiptUrl?: string
  receiptFileName?: string

  // DATEV specific fields
  accountingAccount?: string
  costCenter?: string
  bookingText?: string

  createdAt: string
  updatedAt: string
}

export interface AccountingReport {
  id: string
  title: string
  period: {
    start: string
    end: string
    type: AccountingPeriod
  }
  summary: AccountingSummary
  invoices: AccountingInvoice[]
  expenses: Expense[]
  generatedAt: string
  generatedBy: string
}

export interface DATEVExport {
  header: {
    version: string
    dataCategory: number
    formatName: string
    formatVersion: string
    generatedDate: string
    importedDate?: string
    origin: string
    consultant: string
    client: string
    fiscalYearBegin: string
    accountLength: number
    bookingDateFrom: string
    bookingDateTo: string
    designation: string
    dictionaryName: string
    dictionaryDate: string
    reserved: string
    applicationInfo: string
  }
  bookings: DATEVBooking[]
}

export interface DATEVBooking {
  amount: number
  debitAccount: string
  creditAccount: string
  taxKey?: string
  bookingDate: string
  documentField1: string
  documentField2?: string
  bookingText: string
  postingPeriod?: string
  diverseAccountNumber?: string
  diverseAccountName?: string
  costCenter1?: string
  costCenter2?: string
  currency?: string
  exchangeRate?: number
}

// Predefined accounting accounts for DATEV
export const DATEV_ACCOUNTS = {
  // Revenue accounts (Erlöskonten)
  REVENUE_19_PERCENT: '8400', // Umsatzerlöse 19% USt
  REVENUE_7_PERCENT: '8300',  // Umsatzerlöse 7% USt
  REVENUE_0_PERCENT: '8100',  // Umsatzerlöse 0% USt

  // Expense accounts (Aufwandskonten)
  OFFICE_SUPPLIES: '6815',    // Bürobedarf
  TRAVEL_EXPENSES: '6340',    // Reisekosten
  EQUIPMENT: '6805',          // Geringwertige Wirtschaftsgüter
  MARKETING: '6820',          // Werbekosten
  UTILITIES: '6400',          // Mieten für Einrichtungen
  PROFESSIONAL_SERVICES: '6420', // Rechts- und Beratungskosten

  // Tax accounts (Steuerkonten)
  VAT_INPUT: '1576',          // Vorsteuer 19%
  VAT_OUTPUT: '3806',         // Umsatzsteuer 19%

  // Customer/Supplier accounts
  CUSTOMERS: '10000',         // Forderungen aus Lieferungen und Leistungen
  SUPPLIERS: '70000',         // Verbindlichkeiten aus Lieferungen und Leistungen

  // Bank accounts
  BANK_ACCOUNT: '1200',       // Bank
  CASH: '1000'                // Kasse
}

// Helper functions
export function getAccountingPeriodLabel(period: AccountingPeriod): string {
  const labels: Record<AccountingPeriod, string> = {
    'month': 'Monat',
    'quarter': 'Quartal',
    'year': 'Jahr',
    'all': 'Gesamt',
    'custom': 'Benutzerdefiniert'
  }
  return labels[period]
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    'offen': 'Offen',
    'bezahlt': 'Bezahlt',
    'erstattet': 'Erstattet',
    'storniert': 'Storniert',
    'überfällig': 'Überfällig'
  }
  return labels[status]
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    'office': 'Bürobedarf',
    'travel': 'Reisekosten',
    'equipment': 'Ausstattung',
    'marketing': 'Marketing',
    'utilities': 'Nebenkosten',
    'professional_services': 'Beratung',
    'other': 'Sonstiges'
  }
  return labels[category]
}

export function calculateAccountingSummary(invoices: AccountingInvoice[], expenses: Expense[]): AccountingSummary {
  const summary: AccountingSummary = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalTax: 0,
    vatCollected: 0,
    vatPaid: 0,
    openInvoices: { count: 0, amount: 0 },
    paidInvoices: { count: 0, amount: 0 },
    refundedInvoices: { count: 0, amount: 0 },
    cancelledInvoices: { count: 0, amount: 0 },
    overdueInvoices: { count: 0, amount: 0 }
  }

  // Calculate invoice totals
  invoices.forEach(invoice => {
    const totalAmount = Number(invoice.totalAmount)
    const taxAmount = Number(invoice.taxAmount)

    switch (invoice.status) {
      case 'bezahlt':
        summary.paidInvoices.count++
        summary.paidInvoices.amount += totalAmount
        summary.totalRevenue += totalAmount
        summary.vatCollected += taxAmount
        break
      case 'offen':
        summary.openInvoices.count++
        summary.openInvoices.amount += totalAmount
        break
      case 'erstattet':
        summary.refundedInvoices.count++
        summary.refundedInvoices.amount += totalAmount
        summary.totalRevenue -= totalAmount
        summary.vatCollected -= taxAmount
        break
      case 'storniert':
        summary.cancelledInvoices.count++
        summary.cancelledInvoices.amount += totalAmount
        break
      case 'überfällig':
        summary.overdueInvoices.count++
        summary.overdueInvoices.amount += totalAmount
        break
    }
  })

  // Calculate expense totals
  expenses.forEach(expense => {
    const totalAmount = Number(expense.totalAmount)
    const taxAmount = Number(expense.taxAmount)

    summary.totalExpenses += totalAmount
    summary.vatPaid += taxAmount
  })

  // Calculate net income and total tax
  summary.netIncome = summary.totalRevenue - summary.totalExpenses
  summary.totalTax = summary.vatCollected - summary.vatPaid

  return summary
}
