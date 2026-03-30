// Präzises Datumsfilter-System mit Europe/Berlin Timezone-Unterstützung
export interface DateRange {
  from: string // ISO string
  to: string   // ISO string
  label: string
  preset?: boolean
}

export interface ShopifyFilters {
  created_at_min?: string
  created_at_max?: string
  updated_at_min?: string
  updated_at_max?: string
  financial_status?: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'
  fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'any' | 'unfulfilled'
  status?: 'open' | 'closed' | 'cancelled' | 'any'
  since_id?: string
  fields?: string
  limit?: number
}

export class DateFilterManager {
  private static readonly TIMEZONE = 'Europe/Berlin'

  // Aktuelles Datum in Berlin Timezone abrufen
  static getCurrentDateInBerlin(): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: this.TIMEZONE }))
  }

  // Datum auf Tagesbeginn in Berlin Timezone konvertieren
  static getStartOfDay(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    berlinDate.setHours(0, 0, 0, 0)
    return berlinDate
  }

  // Datum auf Tagesende in Berlin Timezone konvertieren
  static getEndOfDay(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    berlinDate.setHours(23, 59, 59, 999)
    return berlinDate
  }

  // Wochenbeginn (Montag) abrufen
  static getStartOfWeek(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    const day = berlinDate.getDay()
    const diff = berlinDate.getDate() - day + (day === 0 ? -6 : 1) // Montag
    const monday = new Date(berlinDate.setDate(diff))
    return this.getStartOfDay(monday)
  }

  // Wochenende (Sonntag) abrufen
  static getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return this.getEndOfDay(endOfWeek)
  }

  // Monatsbeginn abrufen
  static getStartOfMonth(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    return this.getStartOfDay(new Date(berlinDate.getFullYear(), berlinDate.getMonth(), 1))
  }

  // Monatsende abrufen
  static getEndOfMonth(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    return this.getEndOfDay(new Date(berlinDate.getFullYear(), berlinDate.getMonth() + 1, 0))
  }

  // Jahresbeginn abrufen
  static getStartOfYear(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    return this.getStartOfDay(new Date(berlinDate.getFullYear(), 0, 1))
  }

  // Jahresende abrufen
  static getEndOfYear(date: Date): Date {
    const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: this.TIMEZONE }))
    return this.getEndOfDay(new Date(berlinDate.getFullYear(), 11, 31))
  }

  // Vordefinierte Bereiche abrufen
  static getPresetRanges(): DateRange[] {
    const now = this.getCurrentDateInBerlin()

    return [
      {
        from: this.getStartOfDay(now).toISOString(),
        to: this.getEndOfDay(now).toISOString(),
        label: 'Heute',
        preset: true
      },
      {
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
        label: 'Letzte 24 Stunden',
        preset: true
      },
      {
        from: this.getStartOfWeek(now).toISOString(),
        to: this.getEndOfWeek(now).toISOString(),
        label: 'Diese Woche',
        preset: true
      },
      {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
        label: 'Letzte 7 Tage',
        preset: true
      },
      {
        from: this.getStartOfMonth(now).toISOString(),
        to: this.getEndOfMonth(now).toISOString(),
        label: 'Dieser Monat',
        preset: true
      },
      {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
        label: 'Letzte 30 Tage',
        preset: true
      },
      {
        from: this.getStartOfYear(now).toISOString(),
        to: this.getEndOfYear(now).toISOString(),
        label: 'Dieses Jahr',
        preset: true
      },
      {
        from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
        label: 'Letzte 3 Monate',
        preset: true
      }
    ]
  }

  // Datumsbereich zu Shopify-Filtern konvertieren
  static toShopifyFilters(dateRange: DateRange, options: {
    useCreatedAt?: boolean
    useUpdatedAt?: boolean
    financialStatus?: ShopifyFilters['financial_status']
    fulfillmentStatus?: ShopifyFilters['fulfillment_status']
    status?: ShopifyFilters['status']
  } = {}): ShopifyFilters {
    const filters: ShopifyFilters = {}

    if (options.useCreatedAt !== false) {
      filters.created_at_min = dateRange.from
      filters.created_at_max = dateRange.to
    }

    if (options.useUpdatedAt) {
      filters.updated_at_min = dateRange.from
      filters.updated_at_max = dateRange.to
    }

    if (options.financialStatus) {
      filters.financial_status = options.financialStatus
    }

    if (options.fulfillmentStatus) {
      filters.fulfillment_status = options.fulfillmentStatus
    }

    if (options.status) {
      filters.status = options.status
    }

    return filters
  }

  // Datumsbereich validieren
  static validateDateRange(from: string, to: string): {
    valid: boolean
    error?: string
    correctedRange?: DateRange
  } {
    try {
      const fromDate = new Date(from)
      const toDate = new Date(to)

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return {
          valid: false,
          error: 'Ungültige Daten'
        }
      }

      if (fromDate > toDate) {
        return {
          valid: false,
          error: 'Startdatum muss vor dem Enddatum liegen',
          correctedRange: {
            from: toDate.toISOString(),
            to: fromDate.toISOString(),
            label: 'Korrigiert'
          }
        }
      }

      const now = this.getCurrentDateInBerlin()
      if (fromDate > now) {
        return {
          valid: false,
          error: 'Startdatum kann nicht in der Zukunft liegen'
        }
      }

      // Prüfen ob der Bereich zu groß ist (mehr als ein Jahr)
      const oneYear = 365 * 24 * 60 * 60 * 1000
      if (toDate.getTime() - fromDate.getTime() > oneYear) {
        return {
          valid: false,
          error: 'Zeitraum ist zu groß (mehr als ein Jahr)',
          correctedRange: {
            from: new Date(toDate.getTime() - oneYear).toISOString(),
            to: toDate.toISOString(),
            label: 'Letztes Jahr'
          }
        }
      }

      return { valid: true }

    } catch (error) {
      return {
        valid: false,
        error: 'Fehler bei der Datumsverarbeitung'
      }
    }
  }

  // Datum für Anzeige formatieren
  static formatDateForDisplay(date: string | Date, locale: string = 'de-DE'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat(locale, {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  // DST-Informationen abrufen
  static getDSTInfo(date: Date): {
    isDST: boolean
    offset: number
    transition?: Date
  } {
    const jan = new Date(date.getFullYear(), 0, 1)
    const jul = new Date(date.getFullYear(), 6, 1)

    const janOffset = jan.getTimezoneOffset()
    const julOffset = jul.getTimezoneOffset()

    const isDST = date.getTimezoneOffset() < Math.max(janOffset, julOffset)

    return {
      isDST,
      offset: date.getTimezoneOffset(),
      // Komplexere Logik für Übergangszeiten kann hinzugefügt werden
    }
  }
}

// Hilfsfunktionen für schnelle Nutzung
export const quickFilters = {
  today: () => DateFilterManager.getPresetRanges()[0],
  thisWeek: () => DateFilterManager.getPresetRanges()[2],
  thisMonth: () => DateFilterManager.getPresetRanges()[4],
  thisYear: () => DateFilterManager.getPresetRanges()[6],
  last7Days: () => DateFilterManager.getPresetRanges()[3],
  last30Days: () => DateFilterManager.getPresetRanges()[5],
  last3Months: () => DateFilterManager.getPresetRanges()[7]
}

// Häufige Zahlungsstatus
export const paymentStatusFilters = {
  paid: { financial_status: 'paid' as const, label: 'Bezahlt' },
  pending: { financial_status: 'pending' as const, label: 'Ausstehend' },
  refunded: { financial_status: 'refunded' as const, label: 'Erstattet' },
  partiallyRefunded: { financial_status: 'partially_refunded' as const, label: 'Teilweise erstattet' },
  authorized: { financial_status: 'authorized' as const, label: 'Autorisiert' }
}

// Häufige Bestellstatus
export const orderStatusFilters = {
  open: { status: 'open' as const, label: 'Offen' },
  closed: { status: 'closed' as const, label: 'Geschlossen' },
  cancelled: { status: 'cancelled' as const, label: 'Storniert' },
  any: { status: 'any' as const, label: 'Alle' }
}
