export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-nextauth'
import fs from 'fs'
import path from 'path'
import { ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/lib/reminder-types'

// Simple file-based storage for demo purposes
const STORAGE_DIR = path.join(process.cwd(), 'user-storage', 'reminders')

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

function getUserReminderSettingsPath(userId: number): string {
  ensureStorageDir()
  return path.join(STORAGE_DIR, `user-${userId}-settings.json`)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filePath = getUserReminderSettingsPath(auth.user.id)
    
    if (!fs.existsSync(filePath)) {
      // Return default settings if no custom settings exist
      return NextResponse.json(DEFAULT_REMINDER_SETTINGS)
    }
    
    const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error loading reminder settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings: ReminderSettings = await request.json()
    
    // Validate settings
    if (typeof settings.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
    }

    const filePath = getUserReminderSettingsPath(auth.user.id)
    
    // Add metadata
    const settingsWithMeta = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user.id
    }
    
    fs.writeFileSync(filePath, JSON.stringify(settingsWithMeta, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving reminder settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
