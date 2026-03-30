export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { saveShopifySettings } from '@/lib/shopify-settings'

export async function POST(request: NextRequest) {
  try {
    // Complete Shopify settings with all provided data
    const completeSettings = {
      enabled: true,
      shopDomain: "45dv93-bk.myshopify.com",
      accessToken: "SHOPIFY_ACCESS_TOKEN_PLACEHOLDER", // Admin API Token
      apiKey: "SHOPIFY_API_KEY_PLACEHOLDER", // API-Schlüssel
      secretKey: "SHOPIFY_SECRET_KEY_PLACEHOLDER", // Geheimer API-Schlüssel
      adminUrl: "https://admin.shopify.com/store/45dv93-bk",
      apiVersion: '2030-01',
      autoImport: false,
      importInterval: 60,
      defaultTaxRate: 19,
      defaultPaymentTerms: 14,
      autoSendEmail: true // Enable auto-send for testing
    }

    console.log('🔄 Updating Shopify settings with complete data...')

    // Save the complete settings
    saveShopifySettings(completeSettings)

    console.log('✅ Shopify settings updated successfully!')

    return NextResponse.json({
      success: true,
      message: 'Shopify-Einstellungen mit vollständigen Daten aktualisiert',
      settings: {
        shopDomain: completeSettings.shopDomain,
        adminUrl: completeSettings.adminUrl,
        apiVersion: completeSettings.apiVersion,
        enabled: completeSettings.enabled,
        hasApiKey: !!completeSettings.apiKey,
        hasSecretKey: !!completeSettings.secretKey,
        hasAccessToken: !!completeSettings.accessToken
      }
    })
  } catch (error) {
    console.error('❌ Error updating Shopify settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren der Shopify-Einstellungen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}
