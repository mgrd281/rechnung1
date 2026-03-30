import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Basis-Speicherpfad
const STORAGE_BASE_PATH = path.join(process.cwd(), 'user-storage')

// Sicheren Hash für User-ID erstellen
function createUserHash(userId: string): string {
  return crypto.createHash('sha256').update(`user_${userId}`).digest('hex').substring(0, 16)
}

// Benutzerverzeichnispfad erstellen
export function getUserStoragePath(userId: string): string {
  const userHash = createUserHash(userId)
  return path.join(STORAGE_BASE_PATH, userHash)
}

// Benutzerverzeichnis erstellen, falls nicht vorhanden
export async function ensureUserDirectory(userId: string): Promise<string> {
  const userPath = getUserStoragePath(userId)

  try {
    // Basisverzeichnis erstellen, falls nicht vorhanden
    if (!fs.existsSync(STORAGE_BASE_PATH)) {
      fs.mkdirSync(STORAGE_BASE_PATH, { recursive: true })
    }

    // Benutzerverzeichnis erstellen, falls nicht vorhanden
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath, { recursive: true })

      // Unterverzeichnisse erstellen
      const subDirectories = ['invoices', 'uploads', 'exports', 'temp']
      for (const dir of subDirectories) {
        const subDirPath = path.join(userPath, dir)
        fs.mkdirSync(subDirPath, { recursive: true })
      }

      console.log(`Created user directory: ${userPath}`)
    }

    return userPath
  } catch (error) {
    console.error('Error creating user directory:', error)
    throw new Error('Failed to create user storage directory')
  }
}

// Prüfen, ob Datei dem Benutzer gehört
export function validateFileAccess(userId: string, filePath: string): boolean {
  const userPath = getUserStoragePath(userId)
  const resolvedFilePath = path.resolve(filePath)
  const resolvedUserPath = path.resolve(userPath)

  // Sicherstellen, dass Datei im Benutzerverzeichnis liegt
  return resolvedFilePath.startsWith(resolvedUserPath)
}

// Dateiinformationen sicher abrufen
export async function getFileInfo(userId: string, fileName: string, subDirectory?: string) {
  const userPath = getUserStoragePath(userId)
  const filePath = subDirectory
    ? path.join(userPath, subDirectory, fileName)
    : path.join(userPath, fileName)

  if (!validateFileAccess(userId, filePath)) {
    throw new Error('Access denied: File outside user directory')
  }

  try {
    const stats = fs.statSync(filePath)
    return {
      name: fileName,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      path: filePath
    }
  } catch (error) {
    return null
  }
}

// Benutzerdateien auflisten
export async function listUserFiles(userId: string, subDirectory?: string) {
  const userPath = getUserStoragePath(userId)
  const targetPath = subDirectory
    ? path.join(userPath, subDirectory)
    : userPath

  if (!validateFileAccess(userId, targetPath)) {
    throw new Error('Access denied: Directory outside user scope')
  }

  try {
    if (!fs.existsSync(targetPath)) {
      return []
    }

    const files = fs.readdirSync(targetPath)
    const fileInfos = []

    for (const file of files) {
      const filePath = path.join(targetPath, file)
      const stats = fs.statSync(filePath)

      fileInfos.push({
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        type: path.extname(file).toLowerCase()
      })
    }

    return fileInfos
  } catch (error) {
    console.error('Error listing user files:', error)
    throw new Error('Failed to list user files')
  }
}

// Benutzerdatei sicher löschen
export async function deleteUserFile(userId: string, fileName: string, subDirectory?: string): Promise<boolean> {
  const userPath = getUserStoragePath(userId)
  const filePath = subDirectory
    ? path.join(userPath, subDirectory, fileName)
    : path.join(userPath, fileName)

  if (!validateFileAccess(userId, filePath)) {
    throw new Error('Access denied: File outside user directory')
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted file: ${filePath}`)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

// Größe des Benutzerverzeichnisses berechnen
export async function getUserStorageSize(userId: string): Promise<number> {
  const userPath = getUserStoragePath(userId)

  if (!fs.existsSync(userPath)) {
    return 0
  }

  function getDirectorySize(dirPath: string): number {
    let totalSize = 0

    try {
      const files = fs.readdirSync(dirPath)

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath)
        } else {
          totalSize += stats.size
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error)
    }

    return totalSize
  }

  return getDirectorySize(userPath)
}

// Alte temporäre Dateien bereinigen
export async function cleanupTempFiles(userId: string, olderThanHours: number = 24): Promise<number> {
  const tempPath = path.join(getUserStoragePath(userId), 'temp')

  if (!fs.existsSync(tempPath)) {
    return 0
  }

  const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
  let deletedCount = 0

  try {
    const files = fs.readdirSync(tempPath)

    for (const file of files) {
      const filePath = path.join(tempPath, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath)
        deletedCount++
      }
    }

    console.log(`Cleaned up ${deletedCount} temp files for user ${userId}`)
  } catch (error) {
    console.error('Error cleaning temp files:', error)
  }

  return deletedCount
}

// Backup der Benutzerdateien erstellen
export async function createUserBackup(userId: string): Promise<string> {
  const userPath = getUserStoragePath(userId)
  const backupFileName = `backup_${userId}_${Date.now()}.tar.gz`
  const backupPath = path.join(STORAGE_BASE_PATH, 'backups', backupFileName)

  // Backup-Verzeichnis erstellen
  const backupDir = path.dirname(backupPath)
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  // Hier kann Logik zur Dateikomprimierung hinzugefügt werden
  // Der Einfachheit halber geben wir den Verzeichnispfad zurück
  return userPath
}

export default {
  ensureUserDirectory,
  getUserStoragePath,
  validateFileAccess,
  getFileInfo,
  listUserFiles,
  deleteUserFile,
  getUserStorageSize,
  cleanupTempFiles,
  createUserBackup
}
