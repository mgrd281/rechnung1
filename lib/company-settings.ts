// Default company settings
export const DEFAULT_COMPANY_SETTINGS = {
  id: 'default-org',
  companyName: 'KARINEX', // Renamed from 'name' to match settings page
  name: 'KARINEX', // Keep for backward compatibility
  taxNumber: 'DE452578048', // Renamed from 'taxId' to match settings page
  taxId: 'DE452578048', // Keep for backward compatibility
  address: 'Havighorster Redder 51',
  zip: '22115', // Renamed from 'zipCode' to match settings page
  zipCode: '22115', // Keep for backward compatibility
  city: 'Hamburg',
  country: 'Deutschland',
  bankName: 'N26',
  iban: 'DE22 1001 1001 2087 5043 11',
  bic: 'NTSBDEB1XXX',
  logoUrl: null as string | null, // Renamed from 'logo' to match settings page
  logo: null as string | null, // Keep for backward compatibility
  // Contact information
  phone: '01556 / 3133956',
  email: 'Rechnung@karinex.de',
  // Optional PDF customization
  pdfTemplateEnabled: false,
  pdfTemplateCode: '' as string,
  pdfTemplateMode: 'custom_only' as 'custom_only' | 'custom_after'
}

// Global storage for company settings
declare global {
  var companySettings: typeof DEFAULT_COMPANY_SETTINGS | undefined
  // Browser global cache for client-side PDF usage
  interface Window {
    __companySettings?: typeof DEFAULT_COMPANY_SETTINGS
  }
}

// Initialize global storage (server-side only)
if (typeof window === 'undefined' && !global.companySettings) {
  global.companySettings = { ...DEFAULT_COMPANY_SETTINGS }
}

/**
 * Returns company settings with awareness of runtime (server vs browser).
 * - In the browser, prefer the latest values from window.__companySettings or localStorage
 *   so client-side PDF generation reflects immediate changes without a full page reload.
 * - On the server, use the in-memory global store.
 */
export function getCompanySettings() {
  // Browser-side: use window/localStorage cache if present
  if (typeof window !== 'undefined') {
    if (window.__companySettings) return window.__companySettings
    try {
      const raw = window.localStorage.getItem('companySettings')
      if (raw) {
        const parsed = JSON.parse(raw)
        // Cache on window for faster subsequent access
        window.__companySettings = parsed
        return parsed
      }
    } catch (e) {
      // Ignore JSON/localStorage errors and fall back
    }
  }
  // Server-side or fallback
  return global.companySettings || DEFAULT_COMPANY_SETTINGS
}

export function updateCompanySettings(settings: Partial<typeof DEFAULT_COMPANY_SETTINGS>) {
  if (!global.companySettings) {
    global.companySettings = { ...DEFAULT_COMPANY_SETTINGS }
  }

  global.companySettings = {
    ...global.companySettings,
    ...settings
  }

  return global.companySettings
}

/**
 * Client-side helper to set and persist company settings so that
 * PDF generation (which reads via getCompanySettings) immediately
 * reflects the latest values without waiting for a fresh fetch.
 */
export function setCompanySettingsClient(settings: Partial<typeof DEFAULT_COMPANY_SETTINGS>) {
  if (typeof window === 'undefined') return
  const current = getCompanySettings()
  const next = { ...current, ...settings }
  window.__companySettings = next
  try {
    window.localStorage.setItem('companySettings', JSON.stringify(next))
  } catch (e) {
    // Ignore storage errors
  }
}
