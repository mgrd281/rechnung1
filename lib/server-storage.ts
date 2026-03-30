import 'server-only'
import fs from 'fs'
import path from 'path'

// Lightweight server-side JSON storage utilities
// Uses a user-storage directory in the project root to persist small pieces of state

export type JsonValue = any

function getPaths() {
  // Hardcode absolute path to ensure consistency
  const root = '/Users/m/Desktop/rechnung 6'
  const storageDir = path.join(process.cwd(), 'user-storage')
  return { path, root, storageDir }
}

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch (err) {
    console.warn('server-storage: failed to ensure dir', dir, err)
  }
}

export function readJson(fileName: string, fallback: JsonValue = null, namespace?: string): JsonValue {
  try {
    const { storageDir } = getPaths()
    ensureDir(storageDir)

    // If namespace is provided, prefix the filename
    const finalFileName = namespace ? `${namespace}_${fileName}` : fileName

    const filePath = path.join(storageDir, finalFileName)
    if (!fs.existsSync(filePath)) return fallback

    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.warn('server-storage: readJson failed', fileName, err)
    return fallback
  }
}

export function writeJson(fileName: string, data: JsonValue, namespace?: string): boolean {
  try {
    const { storageDir } = getPaths()
    ensureDir(storageDir)

    // If namespace is provided, prefix the filename
    const finalFileName = namespace ? `${namespace}_${fileName}` : fileName

    const filePath = path.join(storageDir, finalFileName)

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.warn('server-storage: writeJson failed', fileName, err)
    return false
  }
}

// Convenience helpers for this project
const CUSTOMERS_FILE = 'customers.json'
const INVOICES_FILE = 'invoices.json'
const USERS_FILE = 'users.json'

// Load all customers from disk (persistent store)
export function loadCustomersFromDisk(shopDomain?: string): any[] {
  const data = readJson(CUSTOMERS_FILE, { customers: [] }, shopDomain)
  if (data && Array.isArray(data.customers)) return data.customers
  return []
}

// Save all customers to disk
export function saveCustomersToDisk(customers: any[], shopDomain?: string): boolean {
  return writeJson(CUSTOMERS_FILE, { customers, updatedAt: new Date().toISOString() }, shopDomain)
}

// Load all invoices from disk (persistent store)
export function loadInvoicesFromDisk(shopDomain?: string): any[] {
  const data = readJson(INVOICES_FILE, { invoices: [] }, shopDomain)
  if (data && Array.isArray(data.invoices)) return data.invoices
  return []
}

// Save all invoices to disk
export function saveInvoicesToDisk(invoices: any[], shopDomain?: string): boolean {
  return writeJson(INVOICES_FILE, { invoices, updatedAt: new Date().toISOString() }, shopDomain)
}

// Load all users from disk
export function loadUsersFromDisk(): any[] {
  const data = readJson(USERS_FILE, { users: [] })
  let users = (data && Array.isArray(data.users)) ? data.users : []

  // Auto-seed Admin User (mgrdegh@web.de)
  const adminEmail = 'mgrdegh@web.de'
  if (!users.find((u: any) => u.email === adminEmail)) {
    try {
      // Use require here to avoid top-level import issues if bcrypt is not available in some contexts
      const bcrypt = require('bcryptjs')
      console.log('Creating default admin user...')
      const hashedPassword = bcrypt.hashSync('1532@', 10)
      const adminUser = {
        id: 'admin-seed-id',
        email: adminEmail,
        name: 'Admin',
        password: hashedPassword,
        provider: 'credentials',
        isVerified: true,
        isAdmin: true,
        createdAt: new Date().toISOString()
      }
      users.push(adminUser)
      // Save immediately so we don't re-hash on every read
      saveUsersToDisk(users)
    } catch (e) {
      console.error('Failed to seed admin user:', e)
    }
  }

  return users
}

// Save all users to disk
export function saveUsersToDisk(users: any[]): boolean {
  return writeJson(USERS_FILE, { users, updatedAt: new Date().toISOString() })
}
