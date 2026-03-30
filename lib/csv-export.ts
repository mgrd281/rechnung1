/**
 * CSV Export System für Rechnungen/Verkäufe
 * Kompatibel mit Excel Deutschland (UTF-8 BOM, Semikolon-Separator)
 */

export interface InvoiceExportData {
  id: string
  datum: Date
  bestellnummer: string
  rechnungsnummer: string
  kundeName: string
  kundeEmail: string
  betrag: number
  mwst: number
  waehrung: string
  zahlung: string
  status: string
  bezahltBetrag: number
  shopifyOrderId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CSVExportOptions {
  selectedIds?: string[]
  filters?: {
    dateFrom?: Date
    dateTo?: Date
    status?: string
    customer?: string
    category?: string
    searchQuery?: string
    displayedInvoices?: string[]
  }
  columns?: string[]
  includeSummary?: boolean
  filename?: string
}

export interface CSVExportResult {
  success: boolean
  filename: string
  rowCount: number
  totalAmount: number
  downloadUrl?: string
  error?: string
}

/**
 * CSV-Spalten-Konfiguration (Reihenfolge wichtig!)
 */
export const CSV_COLUMNS = [
  { key: 'datum', label: 'Datum', type: 'date' },
  { key: 'bestellnummer', label: 'Bestellnummer', type: 'text' },
  { key: 'rechnungsnummer', label: 'Rechnungsnummer', type: 'text' },
  { key: 'kundeName', label: 'KundeName', type: 'text' },
  { key: 'kundeEmail', label: 'KundeEmail', type: 'text' },
  { key: 'betrag', label: 'Betrag', type: 'currency' },
  { key: 'mwst', label: 'MwSt', type: 'currency' },
  { key: 'waehrung', label: 'Währung', type: 'text' },
  { key: 'zahlung', label: 'Zahlung', type: 'text' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'bezahltBetrag', label: 'Gesamtbetrag bezahlt', type: 'currency' },
  { key: 'shopifyOrderId', label: 'ShopifyOrderId', type: 'text' },
  { key: 'createdAt', label: 'Erstellt am', type: 'date' },
  { key: 'updatedAt', label: 'Aktualisiert am', type: 'date' }
] as const

/**
 * Numerische Spalten für Summenberechnung
 */
export const NUMERIC_COLUMNS = [
  'betrag',
  'mwst',
  'bezahltBetrag'
] as const

/**
 * Formatiert Datum für deutschen CSV-Export (dd.MM.yyyy)
 */
export function formatDateForCSV(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formatiert Zahl für deutschen CSV-Export (Komma als Dezimaltrennzeichen)
 */
export function formatNumberForCSV(value: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Escaped CSV-Wert (Anführungszeichen bei Sonderzeichen)
 */
export function escapeCSVValue(value: string): string {
  // Wenn der Wert Semikolon, Anführungszeichen oder Zeilenumbruch enthält
  if (value.includes(';') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    // Anführungszeichen im Wert verdoppeln und gesamten Wert in Anführungszeichen setzen
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Formatiert einen Wert basierend auf seinem Typ
 */
export function formatValueForCSV(value: any, type: string): string {
  if (value === null || value === undefined) {
    return ''
  }

  switch (type) {
    case 'date':
      return value instanceof Date ? formatDateForCSV(value) : ''

    case 'currency':
    case 'number':
      return typeof value === 'number' ? formatNumberForCSV(value) : '0,00'

    case 'text':
    default:
      return escapeCSVValue(String(value))
  }
}

/**
 * Generiert CSV-Header mit UTF-8 BOM
 */
export function generateCSVHeader(columns: typeof CSV_COLUMNS | Array<typeof CSV_COLUMNS[number]>): string {
  // UTF-8 BOM für korrekte Darstellung in Excel
  const BOM = '\uFEFF'
  const headers = columns.map(col => escapeCSVValue(col.label)).join(';')
  return BOM + headers
}

/**
 * Konvertiert Datenzeile zu CSV-Format
 */
export function convertRowToCSV(data: InvoiceExportData, columns: typeof CSV_COLUMNS | Array<typeof CSV_COLUMNS[number]>): string {
  const values = columns.map(col => {
    const value = data[col.key as keyof InvoiceExportData]
    return formatValueForCSV(value, col.type)
  })

  return values.join(';')
}

/**
 * Berechnet Summen für numerische Spalten
 */
export function calculateSummary(data: InvoiceExportData[]): Record<string, number> {
  const summary: Record<string, number> = {}

  NUMERIC_COLUMNS.forEach(column => {
    summary[column] = data.reduce((sum, row) => {
      const value = row[column as keyof InvoiceExportData] as number
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
  })

  return summary
}

/**
 * Generiert SUMME-Zeile für CSV
 */
export function generateSummaryRow(summary: Record<string, number>, columns: typeof CSV_COLUMNS | Array<typeof CSV_COLUMNS[number]>): string {
  const values = columns.map(col => {
    if (col.key === 'datum') {
      return escapeCSVValue('SUMME')
    }

    if (NUMERIC_COLUMNS.includes(col.key as any)) {
      const value = summary[col.key] || 0
      return formatNumberForCSV(value)
    }

    return '' // Leere Zellen für Text-Spalten
  })

  return values.join(';')
}

/**
 * Generiert Dateiname für CSV-Export
 */
export function generateCSVFilename(customName?: string): string {
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .substring(0, 16) // YYYY-MM-DD_HH-mm

  return customName || `rechnungen_export_${timestamp}.csv`
}

/**
 * Hauptfunktion: Generiert kompletten CSV-Inhalt
 */
export function generateCSVContent(
  data: InvoiceExportData[],
  options: CSVExportOptions = {}
): string {
  const columns = options.columns
    ? CSV_COLUMNS.filter(col => options.columns!.includes(col.key))
    : CSV_COLUMNS

  // Header generieren
  const csvLines: string[] = [generateCSVHeader(columns)]

  // Datenzeilen generieren
  data.forEach(row => {
    csvLines.push(convertRowToCSV(row, columns))
  })

  // Summenzeile hinzufügen (falls gewünscht)
  if (options.includeSummary !== false && data.length > 0) {
    const summary = calculateSummary(data)
    csvLines.push(generateSummaryRow(summary, columns))
  }

  return csvLines.join('\n')
}

/**
 * Simuliert Rechnungsdaten für Demo (wird durch echte DB-Abfrage ersetzt)
 */
export function generateSampleInvoiceData(count: number = 10): InvoiceExportData[] {
  const customers = ['Max Mustermann', 'Erika Musterfrau', 'John Doe', 'Jane Smith', 'Maria Garcia']
  const emails = ['max@example.com', 'erika@example.com', 'john@example.com', 'jane@example.com', 'maria@example.com']
  const statuses = ['BEZAHLT', 'OFFEN', 'STORNIERT', 'GUTSCHRIFT']
  const methods = ['PayPal', 'Stripe', 'Vorkasse', 'Klarna']

  return Array.from({ length: count }, (_, i) => {
    const betrag = Math.random() * 500 + 50
    const mwst = betrag * 0.19

    return {
      id: `inv_${i + 1}`,
      datum: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      bestellnummer: `ORD-${Math.floor(Math.random() * 900000) + 100000}`,
      rechnungsnummer: `RE-${1000 + i}`,
      kundeName: customers[Math.floor(Math.random() * customers.length)],
      kundeEmail: emails[Math.floor(Math.random() * emails.length)],
      betrag: Math.round(betrag * 100) / 100,
      mwst: Math.round(mwst * 100) / 100,
      waehrung: 'EUR',
      zahlung: methods[Math.floor(Math.random() * methods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      bezahltBetrag: Math.round(betrag * (Math.random() > 0.3 ? 1 : 0) * 100) / 100,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
}

/**
 * Filtert Daten basierend auf Optionen
 */
export function filterInvoiceData(
  data: InvoiceExportData[],
  options: CSVExportOptions
): InvoiceExportData[] {
  let filtered = [...data]

  // Filter nach ausgewählten IDs
  if (options.selectedIds && options.selectedIds.length > 0) {
    filtered = filtered.filter(item => options.selectedIds!.includes(item.id))
  }

  // Filter nach Datum
  if (options.filters?.dateFrom) {
    filtered = filtered.filter(item => item.datum >= new Date(options.filters!.dateFrom!))
  }

  if (options.filters?.dateTo) {
    filtered = filtered.filter(item => item.datum <= new Date(options.filters!.dateTo!))
  }

  return filtered
}

/**
 * Hauptexport-Funktion
 */
export async function exportInvoicesToCSV(options: CSVExportOptions = {}): Promise<CSVExportResult> {
  try {
    console.log('🔄 Starting CSV export with options:', options)

    // Daten laden (hier Beispieldaten, in Production aus DB)
    const allData = generateSampleInvoiceData(1000)

    // Daten filtern
    const filteredData = filterInvoiceData(allData, options)

    if (filteredData.length === 0) {
      return {
        success: false,
        filename: '',
        rowCount: 0,
        totalAmount: 0,
        error: 'Keine Daten zum Exportieren gefunden'
      }
    }

    // CSV-Inhalt generieren
    const csvContent = generateCSVContent(filteredData, options)

    // Dateiname generieren
    const filename = generateCSVFilename(options.filename)

    // Gesamtsumme berechnen
    const summary = calculateSummary(filteredData)
    const totalAmount = summary.gewinn || 0

    console.log(`✅ CSV export completed: ${filteredData.length} rows, total: €${totalAmount.toFixed(2)}`)

    return {
      success: true,
      filename,
      rowCount: filteredData.length,
      totalAmount,
      downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    }

  } catch (error) {
    console.error('❌ CSV export failed:', error)
    return {
      success: false,
      filename: '',
      rowCount: 0,
      totalAmount: 0,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}

/**
 * Chunked Export für große Datenmengen (>10k Zeilen)
 */
export async function exportLargeDatasetToCSV(
  options: CSVExportOptions = {},
  chunkSize: number = 1000
): Promise<CSVExportResult> {
  try {
    console.log('🔄 Starting chunked CSV export for large dataset')

    // Hier würde man die Daten in Chunks aus der DB laden
    // Für Demo verwenden wir die normale Funktion
    return await exportInvoicesToCSV(options)

  } catch (error) {
    console.error('❌ Chunked CSV export failed:', error)
    return {
      success: false,
      filename: '',
      rowCount: 0,
      totalAmount: 0,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}
