// ========================================
// SHOPIFY INTEGRATION SETTINGS
// ========================================

export interface ShopifySettings {
  enabled: boolean
  shopDomain: string // e.g., "mystore.myshopify.com"
  accessToken: string // Private app access token (Admin API Token)
  apiKey?: string // API-Schlüssel (optional for some operations)
  secretKey?: string // Geheimer API-Schlüssel (optional for webhooks)
  adminUrl?: string // Shopify Admin URL
  apiVersion: string // e.g., "2027-01"
  autoImport: boolean
  importInterval: number // minutes
  lastImport?: string // ISO date string
  defaultTaxRate: number // Default tax rate for imported orders
  defaultPaymentTerms: number // Default payment terms in days
  autoSendEmail: boolean // Automatically send invoice email to customer
}

export const DEFAULT_SHOPIFY_SETTINGS: ShopifySettings = {
  enabled: true,
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || '45dv93-bk.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  apiVersion: '2025-10',
  autoImport: false,
  importInterval: 60, // 1 hour
  defaultTaxRate: 19, // 19% German VAT
  defaultPaymentTerms: 14, // 14 days payment terms
  autoSendEmail: true, // Default to true to ensure it works on Vercel
}

// ========================================
// SETTINGS MANAGEMENT
// ========================================

/**
 * Get Shopify settings from storage
 */
export function getShopifySettings(): ShopifySettings {
  // Always prioritize Environment Variables if they exist (Critical for Vercel)
  const envSettings = {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN
  }

  if (typeof window === 'undefined') {
    // Server-side: load from file or database
    const fileSettings = loadShopifySettingsFromFile()
    return {
      ...fileSettings,
      // Override with env vars if present
      shopDomain: envSettings.shopDomain || fileSettings.shopDomain,
      accessToken: envSettings.accessToken || fileSettings.accessToken
    }
  }

  // Client-side: load from localStorage
  const stored = localStorage.getItem('shopify-settings')
  if (stored) {
    try {
      return { ...DEFAULT_SHOPIFY_SETTINGS, ...JSON.parse(stored) }
    } catch (error) {
      console.error('Error parsing Shopify settings:', error)
    }
  }

  return DEFAULT_SHOPIFY_SETTINGS
}

/**
 * Save Shopify settings to storage
 */
export function saveShopifySettings(settings: ShopifySettings): void {
  if (typeof window === 'undefined') {
    // Server-side: save to file or database
    saveShopifySettingsToFile(settings)
  } else {
    // Client-side: save to localStorage
    localStorage.setItem('shopify-settings', JSON.stringify(settings))
  }
}

/**
 * Load settings from file (server-side)
 */
function loadShopifySettingsFromFile(): ShopifySettings {
  try {
    const fs = require('fs')
    const path = require('path')

    const isVercel = process.env.VERCEL === '1'
    const settingsPath = isVercel
      ? path.join('/tmp', 'shopify-settings.json')
      : path.join(process.cwd(), 'user-storage', 'shopify-settings.json')

    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8')
      return { ...DEFAULT_SHOPIFY_SETTINGS, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Error loading Shopify settings from file:', error)
  }

  return DEFAULT_SHOPIFY_SETTINGS
}

/**
 * Save settings to file (server-side)
 */
function saveShopifySettingsToFile(settings: ShopifySettings): void {
  try {
    const fs = require('fs')
    const path = require('path')

    const isVercel = process.env.VERCEL === '1'
    // On Vercel, we can only write to /tmp
    const userStorageDir = isVercel ? '/tmp' : path.join(process.cwd(), 'user-storage')
    const settingsPath = path.join(userStorageDir, 'shopify-settings.json')

    // Create directory if it doesn't exist
    if (!fs.existsSync(userStorageDir)) {
      fs.mkdirSync(userStorageDir, { recursive: true })
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Error saving Shopify settings to file:', error)
  }
}

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate Shopify settings
 */
export function validateShopifySettings(settings: ShopifySettings): string[] {
  const errors: string[] = []

  if (settings.enabled) {
    if (!settings.shopDomain) {
      errors.push('Shop Domain ist erforderlich')
    } else if (!settings.shopDomain.includes('.myshopify.com')) {
      errors.push('Shop Domain muss im Format "mystore.myshopify.com" sein')
    }

    if (!settings.accessToken) {
      errors.push('Access Token ist erforderlich')
    } else if (settings.accessToken.length < 20) {
      errors.push('Access Token scheint ungültig zu sein')
    }

    if (settings.defaultTaxRate < 0 || settings.defaultTaxRate > 100) {
      errors.push('Steuersatz muss zwischen 0% und 100% liegen')
    }

    if (settings.defaultPaymentTerms < 1 || settings.defaultPaymentTerms > 365) {
      errors.push('Zahlungsziel muss zwischen 1 und 365 Tagen liegen')
    }
  }

  return errors
}

/**
 * Test Shopify connection
 */
export async function testShopifyConnection(settings: ShopifySettings): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`https://${settings.shopDomain}/admin/api/${settings.apiVersion}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': settings.accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message: `Verbindung erfolgreich! Shop: ${data.shop?.name || 'Unbekannt'}`
      }
    } else {
      return {
        success: false,
        message: `Verbindungsfehler: ${response.status} ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}
