import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { validateFileAccess, getUserStoragePath } from './file-manager'

// Benutzerinformationen aus JWT-Token extrahieren
export function extractUserFromRequest(request: NextRequest): { userId: string; email: string; role: string } | null {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.verify(token, secret) as any

    if (decoded.exp && decoded.exp > Math.floor(Date.now() / 1000)) {
      return {
        userId: String(decoded.userId), // Ensure it's a string
        email: decoded.email,
        role: decoded.role
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting user from request:', error)
    return null
  }
}

// Dateizugriffsberechtigungen prüfen
export function checkFilePermission(
  userId: string,
  filePath: string,
  operation: 'read' | 'write' | 'delete'
): { allowed: boolean; reason?: string } {

  // Grundlegende Prüfung, ob Datei im Benutzerverzeichnis liegt
  if (!validateFileAccess(userId, filePath)) {
    return {
      allowed: false,
      reason: 'File access denied: Outside user directory'
    }
  }

  // Zusätzliche Regeln je nach Operationstyp
  switch (operation) {
    case 'read':
      // Lesen aller Dateien im Benutzerverzeichnis erlauben
      return { allowed: true }

    case 'write':
      // Schreiben in Systemdateien verhindern
      if (filePath.includes('system') || filePath.includes('config')) {
        return {
          allowed: false,
          reason: 'Write access denied: System file'
        }
      }
      return { allowed: true }

    case 'delete':
      // Löschen wichtiger Dateien verhindern
      if (filePath.includes('backup') || filePath.includes('system')) {
        return {
          allowed: false,
          reason: 'Delete access denied: Protected file'
        }
      }
      return { allowed: true }

    default:
      return {
        allowed: false,
        reason: 'Unknown operation'
      }
  }
}

// Speicherplatzbeschränkungen prüfen
export function checkStorageQuota(userId: string, fileSize: number): { allowed: boolean; reason?: string } {
  // Maximal 100 MB pro Benutzer (anpassbar)
  const MAX_STORAGE_MB = 100
  const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024

  // Maximal 10 MB pro Datei
  const MAX_FILE_MB = 10
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

  if (fileSize > MAX_FILE_BYTES) {
    return {
      allowed: false,
      reason: `File too large. Maximum file size is ${MAX_FILE_MB}MB`
    }
  }

  // Hier kann die Prüfung des Gesamtspeichers hinzugefügt werden
  // Der Einfachheit halber erlauben wir den Upload jetzt
  return { allowed: true }
}

// Zulässigen Dateityp prüfen
export function checkFileType(fileName: string, allowedTypes?: string[]): { allowed: boolean; reason?: string } {
  const defaultAllowedTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
    '.jpg', '.jpeg', '.png', '.gif', '.svg',
    '.txt', '.json', '.xml', '.zip', '.rar'
  ]

  const allowed = allowedTypes || defaultAllowedTypes
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))

  if (!allowed.includes(fileExtension)) {
    return {
      allowed: false,
      reason: `File type not allowed. Allowed types: ${allowed.join(', ')}`
    }
  }

  return { allowed: true }
}

// Sicherheitsereignisse protokollieren
export function logSecurityEvent(
  userId: string,
  operation: string,
  filePath: string,
  success: boolean,
  reason?: string
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    userId,
    operation,
    filePath: filePath.replace(getUserStoragePath(userId), '[USER_DIR]'), // Vollständigen Pfad verbergen
    success,
    reason
  }

  console.log('Security Event:', JSON.stringify(logEntry))

  // Hier kann Logging in Datenbank oder Logdatei hinzugefügt werden
}

// Umfassende Sicherheitsprüfung vor Operationen
export function performSecurityCheck(
  userId: string,
  fileName: string,
  filePath: string,
  operation: 'read' | 'write' | 'delete',
  fileSize?: number
): { allowed: boolean; reason?: string } {

  // Dateiberechtigungen prüfen
  const filePermission = checkFilePermission(userId, filePath, operation)
  if (!filePermission.allowed) {
    logSecurityEvent(userId, operation, filePath, false, filePermission.reason)
    return filePermission
  }

  // Dateityp prüfen (nur beim Schreiben)
  if (operation === 'write') {
    const fileType = checkFileType(fileName)
    if (!fileType.allowed) {
      logSecurityEvent(userId, operation, filePath, false, fileType.reason)
      return fileType
    }

    // Speicherplatzbeschränkungen prüfen
    if (fileSize) {
      const quota = checkStorageQuota(userId, fileSize)
      if (!quota.allowed) {
        logSecurityEvent(userId, operation, filePath, false, quota.reason)
        return quota
      }
    }
  }

  logSecurityEvent(userId, operation, filePath, true)
  return { allowed: true }
}

export default {
  extractUserFromRequest,
  checkFilePermission,
  checkStorageQuota,
  checkFileType,
  logSecurityEvent,
  performSecurityCheck
}
