export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Response erstellen
    const response = NextResponse.json(
      {
        success: true,
        message: 'Erfolgreich abgemeldet'
      },
      { status: 200 }
    )

    // Alle authentifizierungsbezogenen Cookies löschen
    response.cookies.delete('auth-token')
    response.cookies.delete('user-info')
    
    // Abgelaufene Cookies setzen, um Löschung sicherzustellen
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('user-info', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Fehler beim Abmelden:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Fehler beim Abmelden aufgetreten'
      },
      { status: 500 }
    )
  }
}

// GET auch für Bequemlichkeit unterstützen
export async function GET(request: NextRequest) {
  return POST(request)
}
