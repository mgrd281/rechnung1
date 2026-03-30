import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// In production, this should be a long random string stored in env vars.
// For now, we'll use a fallback or specific env var if available.
const SC_SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-32-chars-long-!!!';

// Ensure key is 32 bytes
const KEY = crypto.scryptSync(SC_SECRET, 'salt', 32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string | null {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) return null;
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
