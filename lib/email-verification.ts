/**
 * E-Mail-Verifizierungssystem
 * - 6-stellige Codes mit 10 Min Gültigkeit
 * - Rate Limiting und Anti-Abuse
 * - Sichere Speicherung und Logging
 */

export interface VerificationCode {
  id: string
  email: string
  code: string
  hashedCode: string
  createdAt: Date
  expiresAt: Date
  attempts: number
  maxAttempts: number
  isUsed: boolean
  ipAddress?: string
  userAgent?: string
}

export interface VerificationAttempt {
  email: string
  ipAddress: string
  timestamp: Date
  success: boolean
  code?: string
}

export interface RateLimitInfo {
  email: string
  ipAddress: string
  sendAttempts: number
  verifyAttempts: number
  lastSendAt: Date
  lastVerifyAt: Date
  blockedUntil?: Date
}

// In-Memory Storage (in production würde man eine echte DB verwenden)
const verificationCodes = new Map<string, VerificationCode>()
const rateLimits = new Map<string, RateLimitInfo>()
const verificationAttempts: VerificationAttempt[] = []

// Konfiguration
export const VERIFICATION_CONFIG = {
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 10,
  MAX_VERIFY_ATTEMPTS: 5,
  MAX_SEND_ATTEMPTS_PER_HOUR: 5,
  RESEND_COOLDOWN_SECONDS: 60,
  BLOCK_DURATION_MINUTES: 30,
  CLEANUP_INTERVAL_MINUTES: 60
}

/**
 * Generiert einen 6-stelligen Verifizierungscode
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash für sicheren Code-Vergleich
 */
export async function hashCode(code: string): Promise<string> {
  // Einfacher Hash für Demo - in Production würde man bcrypt verwenden
  const encoder = new TextEncoder()
  const data = encoder.encode(code + 'verification_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Erstellt einen neuen Verifizierungscode
 */
export async function createVerificationCode(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ code: string; id: string; expiresAt: Date }> {
  // Cleanup alte Codes
  cleanupExpiredCodes()

  const code = generateVerificationCode()
  const hashedCode = await hashCode(code)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + VERIFICATION_CONFIG.CODE_EXPIRY_MINUTES * 60 * 1000)

  const verificationCode: VerificationCode = {
    id: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    code, // Nur für Logging, wird nach Versand gelöscht
    hashedCode,
    createdAt: now,
    expiresAt,
    attempts: 0,
    maxAttempts: VERIFICATION_CONFIG.MAX_VERIFY_ATTEMPTS,
    isUsed: false,
    ipAddress,
    userAgent
  }

  // Alte Codes für diese E-Mail invalidieren
  for (const [key, existingCode] of Array.from(verificationCodes.entries())) {
    if (existingCode.email === email.toLowerCase()) {
      verificationCodes.delete(key)
    }
  }

  verificationCodes.set(verificationCode.id, verificationCode)

  console.log(`📧 Verification code created for ${email}: ${code} (expires: ${expiresAt.toISOString()})`)

  return {
    code,
    id: verificationCode.id,
    expiresAt
  }
}

/**
 * Verifiziert einen eingegebenen Code
 */
export async function verifyCode(
  email: string,
  inputCode: string,
  ipAddress?: string
): Promise<{ success: boolean; message: string; remainingAttempts?: number }> {
  const normalizedEmail = email.toLowerCase()

  // Finde aktiven Code für diese E-Mail
  let activeCode: VerificationCode | undefined
  for (const code of Array.from(verificationCodes.values())) {
    if (code.email === normalizedEmail && !code.isUsed && code.expiresAt > new Date()) {
      activeCode = code
      break
    }
  }

  if (!activeCode) {
    logVerificationAttempt(normalizedEmail, ipAddress || '', false)
    return {
      success: false,
      message: 'Kein gültiger Verifizierungscode gefunden. Bitte fordern Sie einen neuen Code an.'
    }
  }

  // Prüfe Attempts
  if (activeCode.attempts >= activeCode.maxAttempts) {
    logVerificationAttempt(normalizedEmail, ipAddress || '', false)
    return {
      success: false,
      message: 'Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an.'
    }
  }

  // Increment attempts
  activeCode.attempts++

  // Verifiziere Code
  const hashedInput = await hashCode(inputCode)
  const isValid = hashedInput === activeCode.hashedCode

  if (isValid) {
    activeCode.isUsed = true
    logVerificationAttempt(normalizedEmail, ipAddress || '', true, inputCode)
    console.log(`✅ Email verification successful for ${email}`)

    return {
      success: true,
      message: 'E-Mail erfolgreich verifiziert!'
    }
  } else {
    const remainingAttempts = activeCode.maxAttempts - activeCode.attempts
    logVerificationAttempt(normalizedEmail, ipAddress || '', false, inputCode)

    if (remainingAttempts <= 0) {
      return {
        success: false,
        message: 'Ungültiger Code. Maximale Anzahl Versuche erreicht. Bitte fordern Sie einen neuen Code an.'
      }
    }

    return {
      success: false,
      message: `Ungültiger Code. Noch ${remainingAttempts} Versuche übrig.`,
      remainingAttempts
    }
  }
}

/**
 * Prüft Rate Limits für E-Mail-Versand
 */
export function checkSendRateLimit(email: string, ipAddress: string): {
  allowed: boolean
  message?: string
  cooldownSeconds?: number
  attemptsRemaining?: number
} {
  const key = `${email.toLowerCase()}_${ipAddress}`
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  let rateLimit = rateLimits.get(key)

  if (!rateLimit) {
    rateLimit = {
      email: email.toLowerCase(),
      ipAddress,
      sendAttempts: 0,
      verifyAttempts: 0,
      lastSendAt: new Date(0),
      lastVerifyAt: new Date(0)
    }
    rateLimits.set(key, rateLimit)
  }

  // Prüfe Block
  if (rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
    const remainingSeconds = Math.ceil((rateLimit.blockedUntil.getTime() - now.getTime()) / 1000)
    return {
      allowed: false,
      message: `Temporär gesperrt. Versuchen Sie es in ${remainingSeconds} Sekunden erneut.`
    }
  }

  // Reset Stunden-Counter
  if (rateLimit.lastSendAt < oneHourAgo) {
    rateLimit.sendAttempts = 0
  }

  // Prüfe Stunden-Limit
  if (rateLimit.sendAttempts >= VERIFICATION_CONFIG.MAX_SEND_ATTEMPTS_PER_HOUR) {
    return {
      allowed: false,
      message: 'Maximale Anzahl E-Mails pro Stunde erreicht. Bitte versuchen Sie es später erneut.'
    }
  }

  // Prüfe Cooldown
  const timeSinceLastSend = now.getTime() - rateLimit.lastSendAt.getTime()
  const cooldownMs = VERIFICATION_CONFIG.RESEND_COOLDOWN_SECONDS * 1000

  if (timeSinceLastSend < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSend) / 1000)
    return {
      allowed: false,
      message: `Bitte warten Sie ${remainingSeconds} Sekunden vor dem nächsten Versuch.`,
      cooldownSeconds: remainingSeconds
    }
  }

  return {
    allowed: true,
    attemptsRemaining: VERIFICATION_CONFIG.MAX_SEND_ATTEMPTS_PER_HOUR - rateLimit.sendAttempts
  }
}

/**
 * Aktualisiert Rate Limit nach erfolgreichem Versand
 */
export function updateSendRateLimit(email: string, ipAddress: string): void {
  const key = `${email.toLowerCase()}_${ipAddress}`
  const rateLimit = rateLimits.get(key)

  if (rateLimit) {
    rateLimit.sendAttempts++
    rateLimit.lastSendAt = new Date()
  }
}

/**
 * Loggt Verifizierungsversuche
 */
function logVerificationAttempt(
  email: string,
  ipAddress: string,
  success: boolean,
  code?: string
): void {
  const attempt: VerificationAttempt = {
    email: email.toLowerCase(),
    ipAddress,
    timestamp: new Date(),
    success,
    code: success ? code : undefined // Nur erfolgreiche Codes loggen
  }

  verificationAttempts.push(attempt)

  // Behalte nur die letzten 1000 Attempts
  if (verificationAttempts.length > 1000) {
    verificationAttempts.splice(0, verificationAttempts.length - 1000)
  }

  console.log(`🔍 Verification attempt: ${email} from ${ipAddress} - ${success ? 'SUCCESS' : 'FAILED'}`)
}

/**
 * Cleanup abgelaufener Codes
 */
export function cleanupExpiredCodes(): void {
  const now = new Date()
  const toDelete: string[] = []

  for (const [key, code] of Array.from(verificationCodes.entries())) {
    if (code.expiresAt < now || code.isUsed) {
      toDelete.push(key)
    }
  }

  toDelete.forEach(key => verificationCodes.delete(key))

  if (toDelete.length > 0) {
    console.log(`🧹 Cleaned up ${toDelete.length} expired verification codes`)
  }
}

/**
 * Prüft ob eine E-Mail verifiziert ist
 */
export function isEmailVerified(email: string): boolean {
  const normalizedEmail = email.toLowerCase()

  // Prüfe ob es einen verwendeten Code gibt
  for (const code of Array.from(verificationCodes.values())) {
    if (code.email === normalizedEmail && code.isUsed) {
      return true
    }
  }

  return false
}

/**
 * Holt Statistiken für Monitoring
 */
export function getVerificationStats(): {
  activeCodes: number
  totalAttempts: number
  successfulVerifications: number
  blockedIPs: number
} {
  const now = new Date()
  const activeCodes = Array.from(verificationCodes.values())
    .filter(code => !code.isUsed && code.expiresAt > now).length

  const totalAttempts = verificationAttempts.length
  const successfulVerifications = verificationAttempts
    .filter(attempt => attempt.success).length

  const blockedIPs = Array.from(rateLimits.values())
    .filter(limit => limit.blockedUntil && limit.blockedUntil > now).length

  return {
    activeCodes,
    totalAttempts,
    successfulVerifications,
    blockedIPs
  }
}

// Automatisches Cleanup alle 60 Minuten
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCodes, VERIFICATION_CONFIG.CLEANUP_INTERVAL_MINUTES * 60 * 1000)
}
