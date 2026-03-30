export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Global storage for user settings (in production, this would be a database)
declare global {
  var userSettings: any | undefined
}

// Default settings
const defaultSettings = {
  // Notifications
  emailNotifications: true,
  invoiceReminders: true,
  paymentAlerts: true,
  
  // Security
  twoFactorAuth: false,
  sessionTimeout: 60,
  
  // Display
  theme: 'light',
  compactMode: false
}

// Initialize global settings if not exists
if (!global.userSettings) {
  global.userSettings = { ...defaultSettings }
}

export async function GET() {
  try {
    console.log('Fetching user settings:', global.userSettings)
    
    return NextResponse.json(global.userSettings || defaultSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Updating user settings:', body)

    // Validate required fields
    const requiredFields = ['theme']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            message: `Field '${field}' is required`,
            field: field
          },
          { status: 400 }
        )
      }
    }

    if (typeof body.sessionTimeout !== 'number' || body.sessionTimeout < 5 || body.sessionTimeout > 480) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Session timeout must be between 5 and 480 minutes',
          field: 'sessionTimeout'
        },
        { status: 400 }
      )
    }

    // Validate boolean fields
    const booleanFields = ['emailNotifications', 'invoiceReminders', 'paymentAlerts', 'twoFactorAuth', 'compactMode']
    for (const field of booleanFields) {
      if (typeof body[field] !== 'boolean') {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            message: `Field '${field}' must be a boolean`,
            field: field
          },
          { status: 400 }
        )
      }
    }

    // Validate enum fields
    const validThemes = ['light', 'dark', 'auto']
    if (body.theme && !validThemes.includes(body.theme)) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Invalid theme. Must be one of: ' + validThemes.join(', '),
          field: 'theme'
        },
        { status: 400 }
      )
    }

    // Update global settings
    const previousSettings = { ...global.userSettings }
    global.userSettings = {
      ...global.userSettings,
      ...body,
      updatedAt: new Date().toISOString()
    }

    console.log('Settings update:')
    console.log('Previous:', previousSettings)
    console.log('New:', global.userSettings)
    console.log('Changes applied:', Object.keys(body))

    return NextResponse.json({
      success: true,
      message: 'Einstellungen erfolgreich gespeichert',
      settings: global.userSettings
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update settings',
        message: 'Ein unerwarteter Fehler ist aufgetreten'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Reset to default settings
  try {
    console.log('Resetting settings to default')
    
    global.userSettings = { 
      ...defaultSettings,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Einstellungen auf Standard zurückgesetzt',
      settings: global.userSettings
    })

  } catch (error) {
    console.error('Error resetting settings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset settings',
        message: 'Fehler beim Zurücksetzen der Einstellungen'
      },
      { status: 500 }
    )
  }
}
