export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  AccountingInvoice,
  Expense,
  AccountingSummary,
  ExportFormat,
  DATEVExport,
  DATEVBooking,
  DATEV_ACCOUNTS
} from '@/lib/accounting-types'

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { format, filter, invoices, expenses, additionalIncomes, summary } = await request.json()

    switch (format as ExportFormat) {
      case 'csv':
        return generateCSVExport(invoices, expenses, additionalIncomes || [], summary, filter)
      case 'excel':
        return generateExcelExport(invoices, expenses, additionalIncomes || [], summary, filter)
      case 'pdf':
        return generatePDFReport(invoices, expenses, additionalIncomes || [], summary, filter)
      case 'datev':
        return generateDATEVExport(invoices, expenses, filter)
      case 'zip':
        return generateZIPExport(invoices, expenses, additionalIncomes || [], summary, filter)
      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error exporting accounting data:', error)
    return NextResponse.json(
      { error: 'Failed to export accounting data' },
      { status: 500 }
    )
  }
}

async function generateCSVExport(
  invoices: AccountingInvoice[],
  expenses: Expense[],
  additionalIncomes: any[],
  summary: AccountingSummary,
  filter: any
) {
  const csvLines: string[] = []

  // Header
  csvLines.push('BUCHHALTUNGSEXPORT')
  csvLines.push(`Zeitraum: ${filter.startDate} bis ${filter.endDate}`)
  csvLines.push('')

  // Summary
  csvLines.push('ZUSAMMENFASSUNG')
  csvLines.push('Kategorie,Betrag (EUR)')
  csvLines.push(`Einnahmen,${summary?.totalRevenue?.toFixed(2) || '0.00'}`)
  csvLines.push(`Ausgaben,${summary?.totalExpenses?.toFixed(2) || '0.00'}`)
  csvLines.push(`Nettoeinkommen,${summary?.netIncome?.toFixed(2) || '0.00'}`)
  csvLines.push(`Umsatzsteuer,${summary?.totalTax?.toFixed(2) || '0.00'}`)
  csvLines.push('')

  // Invoices
  csvLines.push('RECHNUNGEN')
  csvLines.push('Rechnungsnr.,Kunde,Datum,Fälligkeitsdatum,Status,Netto,MwSt-Satz,MwSt-Betrag,Brutto,Beschreibung')

  invoices.forEach(invoice => {
    csvLines.push([
      invoice.invoiceNumber,
      `"${invoice.customerName}"`,
      invoice.date,
      invoice.dueDate,
      invoice.status,
      invoice.subtotal.toFixed(2),
      `${invoice.taxRate}%`,
      invoice.taxAmount.toFixed(2),
      invoice.totalAmount.toFixed(2),
      `"${invoice.description}"`
    ].join(','))
  })

  csvLines.push('')

  // Expenses
  csvLines.push('AUSGABEN')
  csvLines.push('Ausgaben-Nr.,Datum,Lieferant,Kategorie,Beschreibung,Netto,MwSt-Satz,MwSt-Betrag,Brutto')

  expenses.forEach(expense => {
    csvLines.push([
      expense.expenseNumber,
      expense.date,
      `"${expense.supplier}"`,
      expense.category,
      `"${expense.description}"`,
      expense.netAmount.toFixed(2),
      `${expense.taxRate}%`,
      expense.taxAmount.toFixed(2),
      expense.totalAmount.toFixed(2)
    ].join(','))
  })

  csvLines.push('')

  // Additional Incomes
  csvLines.push('ZUSÄTZLICHE EINKÜNFTE')
  csvLines.push('Datum,Beschreibung,Betrag')

  additionalIncomes.forEach(income => {
    csvLines.push([
      income.date,
      `"${income.description}"`,
      Number(income.amount).toFixed(2)
    ].join(','))
  })

  const csvContent = csvLines.join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="buchhaltung-${filter.startDate}-${filter.endDate}.csv"`
    }
  })
}

async function generateExcelExport(
  invoices: AccountingInvoice[],
  expenses: Expense[],
  additionalIncomes: any[],
  summary: AccountingSummary,
  filter: any
) {
  // For now, return CSV format with Excel MIME type
  // In production, use a library like xlsx to generate proper Excel files
  const csvContent = await generateCSVExport(invoices, expenses, additionalIncomes, summary, filter)

  return new NextResponse(await csvContent.text(), {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="buchhaltung-${filter.startDate}-${filter.endDate}.xls"`
    }
  })
}

async function generatePDFReport(
  invoices: AccountingInvoice[],
  expenses: Expense[],
  additionalIncomes: any[],
  summary: AccountingSummary,
  filter: any
) {
  // Generate HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Buchhaltungsbericht</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .amount { text-align: right; }
        .positive { color: green; }
        .negative { color: red; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Buchhaltungsbericht</h1>
        <p>Zeitraum: ${new Date(filter.startDate).toLocaleDateString('de-DE')} bis ${new Date(filter.endDate).toLocaleDateString('de-DE')}</p>
      </div>
      
      <div class="summary">
        <h2>Zusammenfassung</h2>
        <table>
          <tr><td>Einnahmen:</td><td class="amount positive">€${summary.totalRevenue.toFixed(2)}</td></tr>
          <tr><td>Ausgaben:</td><td class="amount negative">€${summary.totalExpenses.toFixed(2)}</td></tr>
          <tr><td>Nettoeinkommen:</td><td class="amount ${summary.netIncome >= 0 ? 'positive' : 'negative'}">€${summary.netIncome.toFixed(2)}</td></tr>
          <tr><td>Umsatzsteuer:</td><td class="amount">€${summary.totalTax.toFixed(2)}</td></tr>
        </table>
      </div>
      
      <h2>Rechnungen (${invoices.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Rechnungsnr.</th>
            <th>Kunde</th>
            <th>Datum</th>
            <th>Status</th>
            <th>Netto</th>
            <th>MwSt</th>
            <th>Brutto</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(invoice => `
            <tr>
              <td>${invoice.invoiceNumber}</td>
              <td>${invoice.customerName}</td>
              <td>${new Date(invoice.date).toLocaleDateString('de-DE')}</td>
              <td>${invoice.status}</td>
              <td class="amount">€${invoice.subtotal.toFixed(2)}</td>
              <td class="amount">€${invoice.taxAmount.toFixed(2)}</td>
              <td class="amount">€${invoice.totalAmount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Ausgaben (${expenses.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Lieferant</th>
            <th>Beschreibung</th>
            <th>Kategorie</th>
            <th>Netto</th>
            <th>MwSt</th>
            <th>Brutto</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(expense => `
            <tr>
              <td>${new Date(expense.date).toLocaleDateString('de-DE')}</td>
              <td>${expense.supplier}</td>
              <td>${expense.description}</td>
              <td>${expense.category}</td>
              <td class="amount">€${expense.netAmount.toFixed(2)}</td>
              <td class="amount">€${expense.taxAmount.toFixed(2)}</td>
              <td class="amount">€${expense.totalAmount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        </tbody>
      </table>

      <h2>Zusätzliche Einkünfte (${additionalIncomes.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Beschreibung</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          ${additionalIncomes.map(income => `
            <tr>
              <td>${new Date(income.date).toLocaleDateString('de-DE')}</td>
              <td>${income.description}</td>
              <td class="amount">€${Number(income.amount).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  // For now, return HTML. In production, use puppeteer or similar to generate PDF
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="buchhaltung-${filter.startDate}-${filter.endDate}.html"`
    }
  })
}

async function generateDATEVExport(
  invoices: AccountingInvoice[],
  expenses: Expense[],
  filter: any
) {
  const bookings: DATEVBooking[] = []

  // Process invoices
  invoices.forEach(invoice => {
    if (invoice.status === 'bezahlt') {
      // Revenue booking
      bookings.push({
        amount: invoice.totalAmount,
        debitAccount: DATEV_ACCOUNTS.BANK_ACCOUNT,
        creditAccount: DATEV_ACCOUNTS.REVENUE_19_PERCENT,
        taxKey: '1', // 19% Umsatzsteuer
        bookingDate: invoice.paidDate || invoice.date,
        documentField1: invoice.invoiceNumber,
        bookingText: `Rechnung ${invoice.invoiceNumber} ${invoice.customerName}`,
        postingPeriod: new Date(invoice.date).getMonth() + 1 + '',
        diverseAccountName: invoice.customerName,
        currency: 'EUR'
      })
    }
  })

  // Process expenses
  expenses.forEach(expense => {
    // Expense booking
    const expenseAccount = getExpenseAccount(expense.category)

    bookings.push({
      amount: expense.totalAmount,
      debitAccount: expenseAccount,
      creditAccount: DATEV_ACCOUNTS.BANK_ACCOUNT,
      taxKey: '9', // 19% Vorsteuer
      bookingDate: expense.date,
      documentField1: expense.expenseNumber,
      bookingText: expense.bookingText || expense.description,
      postingPeriod: new Date(expense.date).getMonth() + 1 + '',
      diverseAccountName: expense.supplier,
      currency: 'EUR'
    })
  })

  const datevExport: DATEVExport = {
    header: {
      version: 'EXTF',
      dataCategory: 21,
      formatName: 'Buchungsstapel',
      formatVersion: '9',
      generatedDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      origin: 'SV',
      consultant: '1001',
      client: '10001',
      fiscalYearBegin: new Date().getFullYear() + '0101',
      accountLength: 4,
      bookingDateFrom: filter.startDate.replace(/-/g, ''),
      bookingDateTo: filter.endDate.replace(/-/g, ''),
      designation: 'Buchhaltungsexport',
      dictionaryName: 'Standard',
      dictionaryDate: '20240101',
      reserved: '',
      applicationInfo: 'Rechnungssystem v1.0'
    },
    bookings
  }

  // Generate DATEV CSV format
  const csvLines: string[] = []

  // Header line
  csvLines.push([
    datevExport.header.version,
    datevExport.header.dataCategory,
    datevExport.header.formatName,
    datevExport.header.formatVersion,
    datevExport.header.generatedDate,
    datevExport.header.importedDate || '',
    datevExport.header.origin,
    datevExport.header.consultant,
    datevExport.header.client,
    datevExport.header.fiscalYearBegin,
    datevExport.header.accountLength,
    datevExport.header.bookingDateFrom,
    datevExport.header.bookingDateTo,
    datevExport.header.designation,
    datevExport.header.dictionaryName,
    datevExport.header.dictionaryDate,
    datevExport.header.reserved,
    datevExport.header.applicationInfo
  ].join(';'))

  // Column headers
  csvLines.push([
    'Umsatz (ohne Soll/Haben-Kz)',
    'Soll/Haben-Kennzeichen',
    'WKZ Umsatz',
    'Kurs',
    'Basis-Umsatz',
    'WKZ Basis-Umsatz',
    'Konto',
    'Gegenkonto (ohne BU-Schlüssel)',
    'BU-Schlüssel',
    'Belegdatum',
    'Belegfeld 1',
    'Belegfeld 2',
    'Skonto',
    'Buchungstext'
  ].join(';'))

  // Booking lines
  datevExport.bookings.forEach(booking => {
    csvLines.push([
      booking.amount.toFixed(2).replace('.', ','),
      'S', // Soll
      booking.currency || 'EUR',
      booking.exchangeRate || '',
      '',
      '',
      booking.debitAccount,
      booking.creditAccount,
      booking.taxKey || '',
      booking.bookingDate.replace(/-/g, ''),
      booking.documentField1,
      booking.documentField2 || '',
      '',
      `"${booking.bookingText}"`
    ].join(';'))
  })

  const csvContent = csvLines.join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="EXTF_Buchungsstapel_${filter.startDate}_${filter.endDate}.csv"`
    }
  })
}

function getExpenseAccount(category: string): string {
  const accountMap: { [key: string]: string } = {
    'office': DATEV_ACCOUNTS.OFFICE_SUPPLIES,
    'travel': DATEV_ACCOUNTS.TRAVEL_EXPENSES,
    'equipment': DATEV_ACCOUNTS.EQUIPMENT,
    'marketing': DATEV_ACCOUNTS.MARKETING,
    'utilities': DATEV_ACCOUNTS.UTILITIES,
    'professional_services': DATEV_ACCOUNTS.PROFESSIONAL_SERVICES
  }

  return accountMap[category] || DATEV_ACCOUNTS.OFFICE_SUPPLIES
}

async function generateZIPExport(
  invoices: AccountingInvoice[],
  expenses: Expense[],
  additionalIncomes: any[],
  summary: AccountingSummary,
  filter: any
) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const folderName = `buchhaltung-${filter.startDate}-${filter.endDate}`
  const folder = zip.folder(folderName)

  if (!folder) {
    throw new Error('Failed to create zip folder')
  }

  // 1. Add CSV Export
  const csvResponse = await generateCSVExport(invoices, expenses, additionalIncomes, summary, filter)
  const csvContent = await csvResponse.text()
  folder.file('buchhaltung.csv', csvContent)

  // 2. Add Excel Export (currently CSV with .xls extension as per existing implementation)
  const excelResponse = await generateExcelExport(invoices, expenses, additionalIncomes, summary, filter)
  const excelContent = await excelResponse.text()
  folder.file('buchhaltung.xls', excelContent)

  // 3. Add PDF Report (HTML)
  const pdfResponse = await generatePDFReport(invoices, expenses, additionalIncomes, summary, filter)
  const pdfContent = await pdfResponse.text()
  folder.file('bericht.html', pdfContent)

  // 4. Add DATEV Export
  const datevResponse = await generateDATEVExport(invoices, expenses, filter)
  const datevContent = await datevResponse.text()
  folder.file('datev-export.csv', datevContent)

  // Generate ZIP file
  const zipContent = await zip.generateAsync({ type: 'blob' })

  // Convert Blob to ArrayBuffer for NextResponse
  const arrayBuffer = await zipContent.arrayBuffer()

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${folderName}.zip"`
    }
  })
}
