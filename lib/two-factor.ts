import crypto from 'crypto'
import { authenticator } from 'otplib'
import fs from 'fs'
import path from 'path'

// Configure OTP settings
authenticator.options = {
  step: 30, // 30 seconds window
  window: 1 // Allow 1 step tolerance
}

export interface TwoFactorStatus {
  enabled: boolean
  backupCodes: string[]
  qrCodeUrl?: string
  secret?: string
}

// Simple file-based storage for demo purposes
// In production, use a proper database
const STORAGE_DIR = path.join(process.cwd(), 'user-storage', 'two-factor')

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

function getUserStoragePath(userId: number): string {
  ensureStorageDir()
  return path.join(STORAGE_DIR, `user-${userId}.json`)
}

export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret()
}

export function generateQRCodeUrl(email: string, secret: string): string {
  const serviceName = 'Rechnung System'
  return authenticator.keyuri(email, serviceName, secret)
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

export async function getUserTwoFactorStatus(userId: number): Promise<TwoFactorStatus> {
  try {
    const filePath = getUserStoragePath(userId)
    
    if (!fs.existsSync(filePath)) {
      return {
        enabled: false,
        backupCodes: []
      }
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return {
      enabled: data.enabled || false,
      backupCodes: data.backupCodes || [],
      secret: data.secret
    }
  } catch (error) {
    console.error('Error reading 2FA status:', error)
    return {
      enabled: false,
      backupCodes: []
    }
  }
}

export async function storeTempSecret(userId: number, secret: string): Promise<void> {
  try {
    const filePath = getUserStoragePath(userId)
    const existingData = fs.existsSync(filePath) 
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : {}
    
    const data = {
      ...existingData,
      tempSecret: secret,
      tempSecretCreated: Date.now()
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error storing temp secret:', error)
    throw error
  }
}

export async function verifyTwoFactorCode(userId: number, code: string): Promise<boolean> {
  try {
    const status = await getUserTwoFactorStatus(userId)
    const filePath = getUserStoragePath(userId)
    
    if (!fs.existsSync(filePath)) {
      return false
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    // Check if it's a backup code
    if (status.enabled && status.backupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      const updatedCodes = status.backupCodes.filter(c => c !== code.toUpperCase())
      data.backupCodes = updatedCodes
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      return true
    }
    
    // Check against current secret (for enabled 2FA)
    if (status.enabled && status.secret) {
      return authenticator.verify({ token: code, secret: status.secret })
    }
    
    // Check against temporary secret (during setup)
    if (data.tempSecret) {
      const isValid = authenticator.verify({ token: code, secret: data.tempSecret })
      
      // Clean up temp secret if verification fails or is too old (5 minutes)
      const tempAge = Date.now() - (data.tempSecretCreated || 0)
      if (!isValid || tempAge > 5 * 60 * 1000) {
        delete data.tempSecret
        delete data.tempSecretCreated
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      }
      
      return isValid
    }
    
    return false
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return false
  }
}

export async function enableTwoFactorForUser(userId: number, backupCodes: string[]): Promise<void> {
  try {
    const filePath = getUserStoragePath(userId)
    
    if (!fs.existsSync(filePath)) {
      throw new Error('No temporary secret found')
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    if (!data.tempSecret) {
      throw new Error('No temporary secret found')
    }
    
    // Move temp secret to permanent secret
    const updatedData: any = {
      enabled: true,
      secret: data.tempSecret,
      backupCodes: backupCodes,
      enabledAt: Date.now()
    }
    
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))
  } catch (error) {
    console.error('Error enabling 2FA:', error)
    throw error
  }
}

export async function disableTwoFactorForUser(userId: number): Promise<void> {
  try {
    const filePath = getUserStoragePath(userId)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    throw error
  }
}

export async function requiresTwoFactor(userId: number): Promise<boolean> {
  const status = await getUserTwoFactorStatus(userId)
  return status.enabled
}

// Update the enable endpoint to store temp secret
export async function initiateTwoFactorSetup(userId: number, email: string) {
  const secret = generateTwoFactorSecret()
  const qrCodeUrl = generateQRCodeUrl(email, secret)
  
  // Store temporary secret
  await storeTempSecret(userId, secret)
  
  return {
    enabled: false,
    secret: secret,
    qrCodeUrl: qrCodeUrl,
    backupCodes: []
  }
}
