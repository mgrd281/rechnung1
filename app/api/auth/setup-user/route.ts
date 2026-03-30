export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/file-security'
import { ensureUserDirectory } from '@/lib/file-manager'

// POST - Benutzerverzeichnis nach Login einrichten
export async function POST(request: NextRequest) {
  try {
    // Benutzerinformationen extrahieren
    const user = extractUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Zugriff verweigert' },
        { status: 401 }
      )
    }
    
    // Benutzerverzeichnis erstellen
    const userPath = await ensureUserDirectory(user.userId)
    
    console.log(`User directory setup completed for user ${user.userId}: ${userPath}`)
    
    return NextResponse.json({
      success: true,
      message: 'Persönlicher Speicherplatz erfolgreich eingerichtet',
      data: {
        userId: user.userId,
        setupComplete: true
      }
    })
    
  } catch (error) {
    console.error('Error setting up user directory:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Fehler beim Einrichten des Speicherplatzes',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Benutzer-Setup-Status überprüfen
export async function GET(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Zugriff verweigert' },
        { status: 401 }
      )
    }
    
    // Überprüfen, ob Benutzerverzeichnis existiert
    const fs = require('fs')
    const { getUserStoragePath } = require('@/lib/file-manager')
    const userPath = getUserStoragePath(user.userId)
    const exists = fs.existsSync(userPath)
    
    return NextResponse.json({
      success: true,
      data: {
        userId: user.userId,
        directoryExists: exists,
        userPath: exists ? userPath : null
      }
    })
    
  } catch (error) {
    console.error('Error checking user setup:', error)
    return NextResponse.json(
      { success: false, message: 'Fehler beim Überprüfen der Einrichtung' },
      { status: 500 }
    )
  }
}
