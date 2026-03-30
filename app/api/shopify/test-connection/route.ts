export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings, ShopifySettings } from '@/lib/shopify-settings'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Shopify connection (POST)...')

    const body = await request.json()
    // Use provided settings or fallback to stored settings
    const settings = (body.settings as ShopifySettings) || getShopifySettings()

    console.log('⚙️ Testing with settings:', {
      enabled: settings.enabled,
      shopDomain: settings.shopDomain,
      apiVersion: settings.apiVersion,
      hasAccessToken: !!settings.accessToken
    })

    if (!settings.shopDomain || !settings.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Shop Domain oder Access Token fehlt'
      }, { status: 400 })
    }

    const api = new ShopifyAPI(settings)
    const result = await api.testConnection()

    console.log('🔍 Connection test result:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        shop: result.shop
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message,
        debug: {
          domain: settings.shopDomain,
          tokenPrefix: settings.accessToken?.substring(0, 10),
          apiVersion: settings.apiVersion
        }
      }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Error testing Shopify connection:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Testen der Shopify-Verbindung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}

// Keep GET for backward compatibility if needed, but it might fail on Vercel due to storage issues
export async function GET(request: NextRequest) {
  return POST(request)
}
