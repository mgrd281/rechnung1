import {
  ReminderSettings,
  ReminderSchedule,
  ReminderTemplate,
  ReminderLog,
  ReminderQueue,
  ReminderStatus,
  REMINDER_VARIABLES
} from './reminder-types'
import { sendEmail } from './email-service'
import { generateArizonaPDFBuffer } from './server-pdf-generator'

// Mock invoice and customer interfaces
interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  customerId: string
  currency: string
}

interface Customer {
  id: string
  name: string
  company?: string
  email: string
  language?: 'de'
}

interface CompanySettings {
  name: string
  iban: string
  paymentBaseUrl: string
}

export class ReminderEngine {
  private settings: ReminderSettings
  private companySettings: CompanySettings

  constructor(settings: ReminderSettings, companySettings: CompanySettings) {
    this.settings = settings
    this.companySettings = companySettings
  }

  /**
   * Replace template variables with actual values
   */
  public replaceTemplateVariables(
    template: string,
    invoice: Invoice,
    customer: Customer
  ): string {
    const variables: Record<string, string> = {
      invoice_number: invoice.number,
      invoice_date: this.formatDate(invoice.date),
      due_date: this.formatDate(invoice.dueDate),
      customer_name: customer.name,
      customer_company: customer.company || customer.name,
      total_amount: this.formatCurrency(invoice.totalAmount, invoice.currency),
      open_amount: this.formatCurrency(invoice.totalAmount - invoice.paidAmount, invoice.currency),
      company_name: this.companySettings.name,
      payment_link: this.generatePaymentLink(invoice.id),
      iban: this.companySettings.iban,
      days_overdue: this.calculateDaysOverdue(invoice.dueDate).toString()
    }

    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    })

    return result
  }

  /**
   * Check if an invoice should receive a reminder
   */
  public shouldSendReminder(
    invoice: Invoice,
    schedule: ReminderSchedule,
    lastReminderDate?: Date
  ): boolean {
    // Don't send reminders for paid, cancelled, or refunded invoices
    if (['paid', 'cancelled'].includes(invoice.status)) {
      return false
    }

    // Check if schedule is enabled
    if (!schedule.enabled) {
      return false
    }

    // Calculate trigger date
    const dueDate = new Date(invoice.dueDate)
    const triggerDate = new Date(dueDate)
    triggerDate.setDate(triggerDate.getDate() + schedule.triggerDays)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const triggerDay = new Date(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate())

    // Check if today is the trigger day
    if (today.getTime() !== triggerDay.getTime()) {
      return false
    }

    // Check 24-hour rule: don't send more than one reminder per 24 hours
    if (lastReminderDate) {
      const hoursSinceLastReminder = (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastReminder < 24) {
        return false
      }
    }

    return true
  }

  /**
   * Generate reminder queue items for all invoices
   */
  public async generateReminderQueue(invoices: Invoice[]): Promise<ReminderQueue[]> {
    if (!this.settings.enabled) {
      return []
    }

    const queue: ReminderQueue[] = []
    const now = new Date()

    for (const invoice of invoices) {
      // Skip non-overdue invoices that don't need reminders
      if (invoice.status !== 'overdue' && invoice.status !== 'sent') {
        continue
      }

      for (const schedule of this.settings.schedule) {
        if (!schedule.enabled) continue

        const dueDate = new Date(invoice.dueDate)
        const triggerDate = new Date(dueDate)
        triggerDate.setDate(triggerDate.getDate() + schedule.triggerDays)

        // Set the specific time
        const [hours, minutes] = schedule.time.split(':').map(Number)
        triggerDate.setHours(hours, minutes, 0, 0)

        // Only queue future reminders or today's reminders that haven't been sent
        if (triggerDate >= now) {
          queue.push({
            id: `${invoice.id}_${schedule.id}_${triggerDate.getTime()}`,
            invoiceId: invoice.id,
            scheduleId: schedule.id,
            scheduledDate: triggerDate,
            status: 'pending',
            attempts: 0
          })
        }
      }
    }

    return queue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
  }

  /**
   * Process a reminder from the queue
   */
  public async processReminder(
    queueItem: ReminderQueue,
    invoice: Invoice,
    customer: Customer,
    customSubject?: string,
    customBody?: string
  ): Promise<ReminderLog> {
    const schedule = this.settings.schedule.find(s => s.id === queueItem.scheduleId)
    if (!schedule) {
      throw new Error(`Schedule ${queueItem.scheduleId} not found`)
    }

    // Use custom subject/body if provided, otherwise use template
    let subject: string
    let body: string

    if (customSubject && customBody) {
      subject = customSubject
      body = customBody
    } else {
      // Use the German template (only language supported)
      const template = schedule.template

      // Replace variables in subject and body
      subject = this.replaceTemplateVariables(template.subject, invoice, customer)
      body = this.replaceTemplateVariables(template.body, invoice, customer)
    }

    // Create reminder log entry
    const reminderLog: ReminderLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId: invoice.id,
      customerId: customer.id,
      reminderLevel: schedule.reminderLevel,
      scheduledDate: queueItem.scheduledDate,
      sentDate: new Date(),
      status: 'sent',
      channel: 'email',
      recipient: customer.email,
      subject: subject,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      // Generate PDF attachment if needed
      let attachments = []
      if (this.settings.attachPdf) {
        const pdfBuffer = await this.generateInvoicePdf(invoice)
        if (pdfBuffer) {
          attachments.push({
            filename: `Rechnung_${invoice.number}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          })
        }
      }

      // Convert body to HTML (simple replacement for now)
      const htmlBody = body.replace(/\n/g, '<br/>')

      const result = await sendEmail({
        to: customer.email,
        subject: subject,
        html: htmlBody,
        attachments: attachments
      })

      if (result.success) {
        reminderLog.status = 'sent'
      } else {
        reminderLog.status = 'failed'
        reminderLog.errorMessage = result.error || 'Failed to send email'
      }
    } catch (error) {
      reminderLog.status = 'failed'
      reminderLog.errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }

    return reminderLog
  }

  /**
   * Send manual reminder
   */
  public async sendManualReminder(
    invoice: Invoice,
    customer: Customer,
    reminderLevel: string = 'reminder',
    customSubject?: string,
    customBody?: string
  ): Promise<ReminderLog> {
    const schedule = this.settings.schedule.find(s => s.reminderLevel === reminderLevel)
    if (!schedule) {
      throw new Error(`No schedule found for reminder level: ${reminderLevel}`)
    }

    const queueItem: ReminderQueue = {
      id: `manual_${Date.now()}`,
      invoiceId: invoice.id,
      scheduleId: schedule.id,
      scheduledDate: new Date(),
      status: 'processing',
      attempts: 1
    }

    return this.processReminder(queueItem, invoice, customer, customSubject, customBody)
  }

  /**
   * Get reminder statistics
   */
  public getStatistics(logs: ReminderLog[]): {
    total: number
    sent: number
    failed: number
    byLevel: Record<string, number>
  } {
    const stats = {
      total: logs.length,
      sent: logs.filter(log => log.status === 'sent').length,
      failed: logs.filter(log => log.status === 'failed').length,
      byLevel: {} as Record<string, number>
    }

    logs.forEach(log => {
      stats.byLevel[log.reminderLevel] = (stats.byLevel[log.reminderLevel] || 0) + 1
    })

    return stats
  }

  // Helper methods
  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE')
  }

  private formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  private calculateDaysOverdue(dueDateString: string): number {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  private generatePaymentLink(invoiceId: string): string {
    return `${this.companySettings.paymentBaseUrl}/pay/${invoiceId}`
  }

  // Removed getTemplateForLanguage method - only German supported

  private async sendEmail(emailData: {
    to: string
    subject: string
    body: string
    attachments?: any[]
  }): Promise<void> {
    // Mock email sending - integrate with your email service
    console.log('Sending reminder email:', {
      to: emailData.to,
      subject: emailData.subject,
      bodyLength: emailData.body.length,
      attachments: emailData.attachments?.length || 0
    })

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Email service temporarily unavailable')
    }
  }

  private async generateInvoicePdf(invoice: Invoice): Promise<Buffer | null> {
    return generateArizonaPDFBuffer(invoice.id)
  }
}

// Utility functions for reminder management
export class ReminderManager {
  private static instance: ReminderManager
  private reminderLogs: ReminderLog[] = []
  private reminderQueue: ReminderQueue[] = []

  static getInstance(): ReminderManager {
    if (!ReminderManager.instance) {
      ReminderManager.instance = new ReminderManager()
    }
    return ReminderManager.instance
  }

  public addLog(log: ReminderLog): void {
    this.reminderLogs.push(log)
  }

  public getLogs(filters?: {
    invoiceId?: string
    customerId?: string
    status?: ReminderStatus
    dateFrom?: Date
    dateTo?: Date
  }): ReminderLog[] {
    let logs = [...this.reminderLogs]

    if (filters) {
      if (filters.invoiceId) {
        logs = logs.filter(log => log.invoiceId === filters.invoiceId)
      }
      if (filters.customerId) {
        logs = logs.filter(log => log.customerId === filters.customerId)
      }
      if (filters.status) {
        logs = logs.filter(log => log.status === filters.status)
      }
      if (filters.dateFrom) {
        logs = logs.filter(log => log.sentDate && log.sentDate >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        logs = logs.filter(log => log.sentDate && log.sentDate <= filters.dateTo!)
      }
    }

    return logs.sort((a, b) => (b.sentDate?.getTime() || 0) - (a.sentDate?.getTime() || 0))
  }

  public getLastReminderDate(invoiceId: string): Date | undefined {
    const logs = this.getLogs({ invoiceId })
    const sentLogs = logs.filter(log => log.status === 'sent')
    return sentLogs.length > 0 ? sentLogs[0].sentDate : undefined
  }
}
