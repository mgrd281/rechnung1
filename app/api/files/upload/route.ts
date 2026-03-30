export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { extractUserFromRequest, performSecurityCheck } from '@/lib/file-security'
import { ensureUserDirectory, getUserStoragePath } from '@/lib/file-manager'

export async function POST(request: NextRequest) {
  try {
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    // Sicherstellen, dass das Benutzerverzeichnis existiert
    await ensureUserDirectory(user.userId)

    // Daten aus FormData extrahieren
    const formData = await request.formData()
    const file = formData.get('file') as File
    const subDirectory = formData.get('directory') as string || 'uploads'
    const overwrite = formData.get('overwrite') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Keine Datei ausgewählt' },
        { status: 400 }
      )
    }

    // Dateisicherheit überprüfen
    const userPath = getUserStoragePath(user.userId)
    const targetPath = path.join(userPath, subDirectory, file.name)

    const securityCheck = performSecurityCheck(
      user.userId,
      file.name,
      targetPath,
      'write',
      file.size
    )

    if (!securityCheck.allowed) {
      return NextResponse.json(
        { success: false, message: securityCheck.reason },
        { status: 403 }
      )
    }

    // Überprüfen, ob die Datei existiert
    const fs = require('fs')
    if (fs.existsSync(targetPath) && !overwrite) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datei existiert bereits',
          code: 'FILE_EXISTS'
        },
        { status: 409 }
      )
    }

    // Unterverzeichnis erstellen, falls es nicht existiert
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Datei speichern
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(targetPath, buffer)

    // Informationen der gespeicherten Datei zurückgeben
    const fileStats = fs.statSync(targetPath)

    return NextResponse.json({
      success: true,
      message: 'Datei erfolgreich hochgeladen',
      data: {
        fileName: file.name,
        size: fileStats.size,
        directory: subDirectory,
        uploadedAt: new Date().toISOString(),
        path: path.relative(userPath, targetPath)
      }
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Hochladen der Datei',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Upload-Limit-Informationen
export async function GET(request: NextRequest) {
  try {
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    return NextResponse.json({
      success: true,
      data: {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        maxStorageSize: 100 * 1024 * 1024, // 100 MB
        allowedTypes: [
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
          '.jpg', '.jpeg', '.png', '.gif', '.svg',
          '.txt', '.json', '.xml', '.zip', '.rar'
        ],
        directories: ['uploads', 'invoices', 'exports', 'temp']
      }
    })

  } catch (error) {
    console.error('Error getting upload info:', error)
    return NextResponse.json(
      { success: false, message: 'Fehler beim Abrufen der Upload-Informationen' },
      { status: 500 }
    )
  }
}
