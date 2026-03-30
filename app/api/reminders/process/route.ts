export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-nextauth'
import { ReminderEngine, ReminderManager } from '@/lib/reminder-engine'
import { ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/lib/reminder-types'
import fs from 'fs'
import path from 'path'

// Mock data - in production, this would come from your database
const MOCK_INVOICES = [
  {
    id: 'inv_001',
    number: 'RE-2024-001',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    totalAmount: 1190.00,
    paidAmount: 0,
    status: 'overdue' as const,
    customerId: 'cust_001',
    currency: 'EUR'
  },
  {
    id: 'inv_002',
    number: 'RE-2024-002',
    date: '2024-03-05',
    dueDate: '2024-03-19',
    totalAmount: 850.50,
    paidAmount: 0,
    status: 'sent' as const,
    customerId: 'cust_002',
    currency: 'EUR'
  }
]

const MOCK_CUSTOMERS = [
  {
    id: 'cust_001',
    name: 'Max Mustermann',
    company: 'Mustermann GmbH',
    email: 'max@mustermann.de',
    language: 'de' as const
  },
  {
    id: 'cust_002',
    name: 'Anna Schmidt',
    company: 'Schmidt & Partner GmbH',
    email: 'anna@schmidt-partner.de',
    language: 'de' as const
  }
]

const MOCK_COMPANY_SETTINGS = {
  name: 'Ihre Firma GmbH',
  iban: 'DE89 3704 0044 0532 0130 00',
  paymentBaseUrl: 'https://pay.example.com'
}

function getUserReminderSettingsPath(userId: number): string {
  const storageDir = path.join(process.cwd(), 'user-storage', 'reminders')
  return path.join(storageDir, `user-${userId}-settings.json`)
}

function loadUserReminderSettings(userId: number): ReminderSettings {
  try {
    const filePath = getUserReminderSettingsPath(userId)
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading reminder settings:', error)
  }
  return DEFAULT_REMINDER_SETTINGS
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load user's reminder settings
    const settings = loadUserReminderSettings(auth.user.id)
    
    if (!settings.enabled) {
      return NextResponse.json({ 
        message: 'Reminder system is disabled',
        processed: 0 
      })
    }

    // Initialize reminder engine
    const reminderEngine = new ReminderEngine(settings, MOCK_COMPANY_SETTINGS)
    const reminderManager = ReminderManager.getInstance()

    // Generate reminder queue for all invoices
    const queue = await reminderEngine.generateReminderQueue(MOCK_INVOICES)
    
    // Process reminders that are due now
    const now = new Date()
    const dueReminders = queue.filter(item => {
      const scheduledTime = new Date(item.scheduledDate)
      const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime())
      // Process reminders within 1 hour of scheduled time
      return timeDiff <= 60 * 60 * 1000 && scheduledTime <= now
    })

    const results = []
    
    for (const queueItem of dueReminders) {
      const invoice = MOCK_INVOICES.find(inv => inv.id === queueItem.invoiceId)
      const customer = MOCK_CUSTOMERS.find(cust => cust.id === invoice?.customerId)
      
      if (!invoice || !customer) {
        console.error(`Invoice or customer not found for queue item ${queueItem.id}`)
        continue
      }

      // Check if reminder should be sent (protection rules)
      const schedule = settings.schedule.find(s => s.id === queueItem.scheduleId)
      if (!schedule) continue

      const lastReminderDate = reminderManager.getLastReminderDate(invoice.id)
      
      if (reminderEngine.shouldSendReminder(invoice, schedule, lastReminderDate)) {
        try {
          const reminderLog = await reminderEngine.processReminder(queueItem, invoice, customer)
          reminderManager.addLog(reminderLog)
          
          results.push({
            invoiceId: invoice.id,
            customerEmail: customer.email,
            reminderLevel: schedule.reminderLevel,
            status: reminderLog.status,
            subject: reminderLog.subject
          })
        } catch (error) {
          console.error(`Error processing reminder for invoice ${invoice.id}:`, error)
          results.push({
            invoiceId: invoice.id,
            customerEmail: customer.email,
            reminderLevel: schedule.reminderLevel,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Reminder processing completed',
      processed: results.length,
      totalInQueue: queue.length,
      dueNow: dueReminders.length,
      results: results
    })

  } catch (error) {
    console.error('Error processing reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check reminder queue status
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = loadUserReminderSettings(auth.user.id)
    
    if (!settings.enabled) {
      return NextResponse.json({ 
        enabled: false,
        queue: [],
        nextReminder: null
      })
    }

    const reminderEngine = new ReminderEngine(settings, MOCK_COMPANY_SETTINGS)
    const queue = await reminderEngine.generateReminderQueue(MOCK_INVOICES)
    
    // Find next reminder
    const now = new Date()
    const upcomingReminders = queue
      .filter(item => new Date(item.scheduledDate) > now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

    const nextReminder = upcomingReminders.length > 0 ? upcomingReminders[0] : null

    return NextResponse.json({
      enabled: true,
      totalInQueue: queue.length,
      upcomingCount: upcomingReminders.length,
      nextReminder: nextReminder ? {
        invoiceId: nextReminder.invoiceId,
        scheduledDate: nextReminder.scheduledDate,
        scheduleId: nextReminder.scheduleId
      } : null,
      queue: queue.slice(0, 10) // Return first 10 items for preview
    })

  } catch (error) {
    console.error('Error getting reminder queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
