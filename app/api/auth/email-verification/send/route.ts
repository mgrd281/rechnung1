export const dynamic = "force-dynamic"
/**
 * API Endpoint: E-Mail-Verifizierungscode senden
 * POST /api/auth/email-verification/send
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createVerificationCode, 
  checkSendRateLimit, 
  updateSendRateLimit,
  cleanupExpiredCodes 
} from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/email-verification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body
    
    // Validierung
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Gültige E-Mail-Adresse erforderlich' },
        { status: 400 }
      )
    }
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name erforderlich (mindestens 2 Zeichen)' },
        { status: 400 }
      )
    }
    
    // IP-Adresse für Rate Limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    console.log(`📧 Verification request from ${email} (IP: ${ipAddress})`)
    
    // Rate Limiting prüfen
    const rateLimitCheck = checkSendRateLimit(email, ipAddress)
    if (!rateLimitCheck.allowed) {
      console.log(`🚫 Rate limit exceeded for ${email}:`, rateLimitCheck.message)
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitCheck.message,
          cooldownSeconds: rateLimitCheck.cooldownSeconds
        },
        { status: 429 }
      )
    }
    
    // Cleanup alte Codes
    cleanupExpiredCodes()
    
    // Neuen Verifizierungscode erstellen
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const { code, id, expiresAt } = await createVerificationCode(
      email, 
      ipAddress, 
      userAgent
    )
    
    // Optional: Bestätigungslink erstellen
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const confirmationLink = `${baseUrl}/auth/verify-email?code=${code}&email=${encodeURIComponent(email)}`
    
    // E-Mail senden
    const emailResult = await sendVerificationEmail(
      email,
      name,
      code,
      expiresAt,
      confirmationLink
    )
    
    if (!emailResult.success) {
      console.error(`❌ Failed to send verification email to ${email}:`, emailResult.error)
      return NextResponse.json(
        { success: false, error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }
    
    // Rate Limit aktualisieren
    updateSendRateLimit(email, ipAddress)
    
    console.log(`✅ Verification email sent to ${email} (Message ID: ${emailResult.messageId})`)
    
    return NextResponse.json({
      success: true,
      message: 'Verifizierungscode wurde gesendet',
      expiresAt: expiresAt.toISOString(),
      attemptsRemaining: rateLimitCheck.attemptsRemaining,
      messageId: emailResult.messageId
    })
    
  } catch (error) {
    console.error('❌ Error in email verification send:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// GET für Status-Abfrage (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail-Parameter erforderlich' },
        { status: 400 }
      )
    }
    
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const rateLimitCheck = checkSendRateLimit(email, ipAddress)
    
    return NextResponse.json({
      success: true,
      canSend: rateLimitCheck.allowed,
      attemptsRemaining: rateLimitCheck.attemptsRemaining,
      cooldownSeconds: rateLimitCheck.cooldownSeconds,
      message: rateLimitCheck.message
    })
    
  } catch (error) {
    console.error('❌ Error in email verification status:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
