export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getShopifySettings, saveShopifySettings, validateShopifySettings } from '@/lib/shopify-settings'

// GET: Get current Shopify settings
export async function GET() {
  try {
    const settings = getShopifySettings()
    
    // Don't send sensitive data to client
    const safeSettings = {
      ...settings,
      accessToken: settings.accessToken ? `${settings.accessToken.substring(0, 10)}...${settings.accessToken.slice(-4)}` : '',
      apiKey: settings.apiKey ? `${settings.apiKey.substring(0, 8)}...${settings.apiKey.slice(-4)}` : '',
      secretKey: settings.secretKey ? '***' : ''
    }
    
    return NextResponse.json({
      success: true,
      settings: safeSettings
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fehler beim Laden der Shopify-Einstellungen' 
      },
      { status: 500 }
    )
  }
}

// POST: Save Shopify settings
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    
    console.log(' Saving Shopify settings:', {
      enabled: settings.enabled,
      shopDomain: settings.shopDomain,
      hasAccessToken: !!settings.accessToken,
      hasApiKey: !!settings.apiKey,
      hasSecretKey: !!settings.secretKey,
      apiVersion: settings.apiVersion
    })
    
    // Validate settings
    const errors = validateShopifySettings(settings)
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ungültige Einstellungen',
          details: errors
        },
        { status: 400 }
      )
    }
    
    // Save settings
    saveShopifySettings(settings)
    
    return NextResponse.json({
      success: true,
      message: 'Shopify-Einstellungen gespeichert'
    })
  } catch (error) {
    console.error(' Error saving Shopify settings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fehler beim Speichern der Shopify-Einstellungen' 
      },
      { status: 500 }
    )
  }
}

// PUT: Update specific Shopify settings
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    const currentSettings = getShopifySettings()
    
    // Merge with current settings
    const newSettings = { ...currentSettings, ...updates }
    
    console.log(' Updating Shopify settings:', {
      enabled: newSettings.enabled,
      shopDomain: newSettings.shopDomain,
      hasAccessToken: !!newSettings.accessToken,
      hasApiKey: !!newSettings.apiKey,
      hasSecretKey: !!newSettings.secretKey
    })
    
    // Validate merged settings
    const errors = validateShopifySettings(newSettings)
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ungültige Einstellungen',
          details: errors
        },
        { status: 400 }
      )
    }
    
    // Save updated settings
    saveShopifySettings(newSettings)
    
    return NextResponse.json({
      success: true,
      message: 'Shopify-Einstellungen aktualisiert'
    })
  } catch (error) {
    console.error(' Error updating Shopify settings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fehler beim Aktualisieren der Shopify-Einstellungen' 
      },
      { status: 500 }
    )
  }
}
