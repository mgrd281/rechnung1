export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { extractUserFromRequest, performSecurityCheck } from '@/lib/file-security'
import { getUserStoragePath, getFileInfo, deleteUserFile } from '@/lib/file-manager'

// GET - Datei herunterladen
export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { filename } = await params
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    const { searchParams } = new URL(request.url)
    const subDirectory = searchParams.get('dir') || 'uploads'
    const download = searchParams.get('download') === 'true'

    const fileName = decodeURIComponent(params.filename)
    const userPath = getUserStoragePath(user.userId)
    const filePath = path.join(userPath, subDirectory, fileName)

    // Zugriffssicherheit überprüfen
    const securityCheck = performSecurityCheck(
      user.userId,
      fileName,
      filePath,
      'read'
    )

    if (!securityCheck.allowed) {
      return NextResponse.json(
        { success: false, message: securityCheck.reason },
        { status: 403 }
      )
    }

    // Überprüfen, ob die Datei existiert
    const fileInfo = await getFileInfo(user.userId, fileName, subDirectory)
    if (!fileInfo) {
      return NextResponse.json(
        { success: false, message: 'Datei nicht gefunden' },
        { status: 404 }
      )
    }

    // Datei lesen
    const fileBuffer = await readFile(filePath)

    // Content-Type bestimmen
    const ext = path.extname(fileName).toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.xml': 'application/xml',
      '.zip': 'application/zip'
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'

    // Antwort erstellen
    const response = new NextResponse(fileBuffer as any)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Length', fileBuffer.length.toString())

    if (download) {
      response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    } else {
      response.headers.set('Content-Disposition', `inline; filename="${fileName}"`)
    }

    return response

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Herunterladen der Datei',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Datei löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { filename } = await params
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    const { searchParams } = new URL(request.url)
    const subDirectory = searchParams.get('dir') || 'uploads'

    const fileName = decodeURIComponent(filename)
    const userPath = getUserStoragePath(user.userId)
    const filePath = path.join(userPath, subDirectory, fileName)

    // Löschsicherheit überprüfen
    const securityCheck = performSecurityCheck(
      user.userId,
      fileName,
      filePath,
      'delete'
    )

    if (!securityCheck.allowed) {
      return NextResponse.json(
        { success: false, message: securityCheck.reason },
        { status: 403 }
      )
    }

    // Datei löschen
    const deleted = await deleteUserFile(user.userId, fileName, subDirectory)

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Datei erfolgreich gelöscht',
        data: { fileName, directory: subDirectory }
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Datei nicht gefunden' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Löschen der Datei',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Dateiinformationen
export async function PUT(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { filename } = await params
    // Benutzerinformationen extrahieren oder Standard-Benutzer verwenden
    let user = extractUserFromRequest(request)
    if (!user) {
      // Standard-Benutzer für öffentlichen Zugang verwenden
      user = { userId: '1', email: 'guest@example.com', role: 'user' }
    }

    const { searchParams } = new URL(request.url)
    const subDirectory = searchParams.get('dir') || 'uploads'

    const fileName = decodeURIComponent(filename)

    // Dateiinformationen abrufen
    const fileInfo = await getFileInfo(user.userId, fileName, subDirectory)

    if (!fileInfo) {
      return NextResponse.json(
        { success: false, message: 'Datei nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: fileInfo
    })

  } catch (error) {
    console.error('Error getting file info:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen der Dateiinformationen',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
