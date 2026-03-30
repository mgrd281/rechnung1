export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest, performSecurityCheck } from '@/lib/file-security'
import {
  ensureUserDirectory,
  listUserFiles,
  getUserStorageSize,
  cleanupTempFiles
} from '@/lib/file-manager'

// GET - Benutzerdateiliste
export async function GET(request: NextRequest) {
  try {
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    // Parameter abrufen
    const { searchParams } = new URL(request.url)
    const subDirectory = searchParams.get('dir') || undefined
    const includeSize = searchParams.get('includeSize') === 'true'

    // Sicherstellen, dass das Benutzerverzeichnis existiert
    await ensureUserDirectory(user.userId)

    // Dateiliste abrufen
    const files = await listUserFiles(user.userId, subDirectory)

    // Gesamtgröße berechnen, falls angefordert
    let totalSize = 0
    if (includeSize) {
      totalSize = await getUserStorageSize(user.userId)
    }

    return NextResponse.json({
      success: true,
      data: {
        files,
        totalSize: includeSize ? totalSize : undefined,
        directory: subDirectory || 'root'
      }
    })

  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Laden der Dateien',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Temporäre Dateien aufräumen
export async function POST(request: NextRequest) {
  try {
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    const body = await request.json()
    const { action, olderThanHours } = body

    if (action === 'cleanup') {
      const deletedCount = await cleanupTempFiles(user.userId, olderThanHours || 24)

      return NextResponse.json({
        success: true,
        message: `${deletedCount} temporäre Dateien gelöscht`,
        data: { deletedCount }
      })
    }

    return NextResponse.json(
      { success: false, message: 'Nicht unterstützte Operation' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in file operation:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler bei der Operation',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
