export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ensureUserDirectory } from '@/lib/file-manager'

import { prisma } from '@/lib/prisma'


// Funktion zum Verschlüsseln des Passworts (für Dateneinrichtung)
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Funktion zur Passwortüberprüfung
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Funktion zur JWT-Token-Erstellung
function generateToken(userId: string, email: string, role: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // ⭐ 7 days (matching cookie)
  }

  return jwt.sign(payload, secret)
}

// Funktion zur E-Mail-Validierung
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Daten vom Benutzer empfangen
    const body = await request.json()
    const { email, password } = body

    // Überprüfung der erforderlichen Daten
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'E-Mail und Passwort sind erforderlich',
          field: !email ? 'email' : 'password'
        },
        { status: 400 }
      )
    }

    // E-Mail-Format überprüfen
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'E-Mail-Format ist ungültig',
          field: 'email'
        },
        { status: 400 }
      )
    }

    // Passwortlänge überprüfen
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Passwort muss mindestens 6 Zeichen lang sein',
          field: 'password'
        },
        { status: 400 }
      )
    }

    // 2️⃣ Benutzer in der Datenbank suchen
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { organization: true }
    })

    // 4️⃣ Benutzerexistenz überprüfen
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kein Konto mit dieser E-Mail registriert. Bitte zuerst registrieren',
          field: 'email'
        },
        { status: 404 }
      )
    }

    // 7️⃣ Kontostatus überprüfen (aktiv/inaktiv)
    // Note: isSuspended is the field in schema, defaulting to false. 
    // If you want to check active status, ensure logic matches schema.
    if (user.isSuspended) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ihr Konto ist gesperrt. Bitte kontaktieren Sie den Support.',
          field: 'account'
        },
        { status: 403 }
      )
    }

    // Passwort ist bereits verschlüsselt gespeichert

    // 3️⃣ Passwortüberprüfung
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Passwort nicht gesetzt. Bitte Passwort zurücksetzen.',
          field: 'password'
        },
        { status: 400 }
      )
    }

    const dbPasswordValid = await verifyPassword(password, user.passwordHash)

    // Check for environment variable override (Master Admin Credentials)
    const envAdminEmail = process.env.ADMIN_EMAIL
    const envAdminPassword = process.env.ADMIN_PASSWORD

    const isEnvAdminMatch = envAdminEmail && envAdminPassword &&
      email.toLowerCase() === envAdminEmail.toLowerCase() &&
      password === envAdminPassword

    const isPasswordValid = dbPasswordValid || isEnvAdminMatch

    // 5️⃣ Passwortüberprüfung
    if (!isPasswordValid) {
      console.log(`🔐 [API] Login failed: Password mismatch for ${email}`)
      return NextResponse.json(
        {
          success: false,
          message: 'Das eingegebene Passwort ist falsch. Bitte versuchen Sie es erneut.',
          field: 'password'
        },
        { status: 401 }
      )
    }

    // 6️⃣ JWT-Token nach vollständiger Datenüberprüfung erstellen
    const token = generateToken(user.id, user.email, user.role)

    // Benutzerverzeichnis automatisch erstellen
    try {
      await ensureUserDirectory(user.id)
      console.log(`User directory created/verified for user ${user.id}`)
    } catch (error) {
      console.error('Error creating user directory:', error)
      // Login-Prozess wegen diesem Fehler nicht stoppen
    }

    // Letzten Login aktualisieren
    const loginTime = new Date().toISOString()

    // Response mit Cookie-Einstellung erstellen
    const response = NextResponse.json(
      {
        success: true,
        message: 'Erfolgreich angemeldet',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: loginTime
        },
        token,
        redirectTo: '/dashboard'
      },
      { status: 200 }
    )

    // JWT-Token in HTTP-only Cookie für Sicherheit setzen
    response.cookies.set('auth-token', token, {
      httpOnly: true,              // ⭐ Cannot be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production', // ⭐ HTTPS only in production
      sameSite: 'strict',          // ⭐ CSRF protection
      maxAge: 60 * 60 * 24 * 7,    // ⭐ 7 days in seconds
      path: '/'
    })

    // ⚠️ REMOVE insecure user-info cookie - use server-side auth only
    // Delete any existing user-info cookie for security
    response.cookies.delete('user-info')

    return response

  } catch (error) {
    console.error('Fehler beim Anmelden:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Serverfehler aufgetreten. Bitte versuchen Sie es erneut',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

