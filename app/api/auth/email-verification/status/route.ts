export const dynamic = "force-dynamic"
/**
 * API Endpoint: E-Mail-Verifizierungsstatus abfragen
 * GET /api/auth/email-verification/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { isEmailVerified, getVerificationStats } from '@/lib/email-verification'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const statsOnly = searchParams.get('stats') === 'true'
    
    // Wenn nur Statistiken angefragt werden
    if (statsOnly) {
      const stats = getVerificationStats()
      return NextResponse.json({
        success: true,
        stats
      })
    }
    
    // E-Mail-spezifische Abfrage
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail-Parameter erforderlich' },
        { status: 400 }
      )
    }
    
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Gültige E-Mail-Adresse erforderlich' },
        { status: 400 }
      )
    }
    
    const isVerified = isEmailVerified(email)
    
    console.log(`📊 Verification status check for ${email}: ${isVerified ? 'VERIFIED' : 'NOT_VERIFIED'}`)
    
    return NextResponse.json({
      success: true,
      email: email.toLowerCase(),
      isVerified,
      message: isVerified 
        ? 'E-Mail-Adresse ist verifiziert' 
        : 'E-Mail-Adresse ist nicht verifiziert'
    })
    
  } catch (error) {
    console.error('❌ Error in email verification status:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST für Admin-Funktionen (z.B. manuell als verifiziert markieren)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email } = body
    
    // Einfache Admin-Authentifizierung (in Production sollte das sicherer sein)
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }
    
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Gültige E-Mail-Adresse erforderlich' },
        { status: 400 }
      )
    }
    
    switch (action) {
      case 'mark_verified':
        // In einer echten Implementierung würde man hier die DB aktualisieren
        console.log(`👨‍💼 Admin marked ${email} as verified`)
        return NextResponse.json({
          success: true,
          message: `E-Mail ${email} wurde als verifiziert markiert`
        })
        
      case 'reset_verification':
        // Verifizierung zurücksetzen
        console.log(`👨‍💼 Admin reset verification for ${email}`)
        return NextResponse.json({
          success: true,
          message: `Verifizierung für ${email} wurde zurückgesetzt`
        })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unbekannte Aktion' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('❌ Error in email verification admin action:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
