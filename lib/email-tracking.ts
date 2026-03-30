// Email tracking and logging system

export interface EmailLog {
  id: string
  invoiceId: string
  recipientEmail: string
  ccEmail?: string
  messageId?: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  provider: string
  sentAt?: Date
  deliveredAt?: Date
  failedAt?: Date
  errorMessage?: string
  retryCount: number
  lastRetryAt?: Date
  metadata?: {
    invoiceNumber: string
    customerName: string
    pdfSize?: number
    smtpResponse?: string
  }
}

// In-memory storage for demo (replace with real database)
const emailLogs: EmailLog[] = []

// Create new email log entry
export function createEmailLog(data: {
  invoiceId: string
  recipientEmail: string
  ccEmail?: string
  invoiceNumber: string
  customerName: string
  provider: string
}): EmailLog {
  const log: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    invoiceId: data.invoiceId,
    recipientEmail: data.recipientEmail,
    ccEmail: data.ccEmail,
    status: 'pending',
    provider: data.provider,
    retryCount: 0,
    metadata: {
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName
    }
  }

  emailLogs.push(log)
  console.log('📝 Created email log:', log.id)
  return log
}

// Update email log status
export function updateEmailLog(
  logId: string, 
  updates: Partial<EmailLog>
): EmailLog | null {
  const logIndex = emailLogs.findIndex(log => log.id === logId)
  if (logIndex === -1) {
    console.error('❌ Email log not found:', logId)
    return null
  }

  const log = emailLogs[logIndex]
  const updatedLog = { ...log, ...updates }
  
  // Set timestamps based on status
  if (updates.status === 'sent' && !updatedLog.sentAt) {
    updatedLog.sentAt = new Date()
  } else if (updates.status === 'delivered' && !updatedLog.deliveredAt) {
    updatedLog.deliveredAt = new Date()
  } else if (updates.status === 'failed' && !updatedLog.failedAt) {
    updatedLog.failedAt = new Date()
  }

  emailLogs[logIndex] = updatedLog
  console.log(`📝 Updated email log ${logId}:`, updates)
  return updatedLog
}

// Mark email as sent with message ID
export function markEmailSent(
  logId: string, 
  messageId: string, 
  smtpResponse?: string
): EmailLog | null {
  const existingLog = emailLogs.find(log => log.id === logId)
  return updateEmailLog(logId, {
    status: 'sent',
    messageId,
    metadata: {
      invoiceNumber: existingLog?.metadata?.invoiceNumber || '',
      customerName: existingLog?.metadata?.customerName || '',
      pdfSize: existingLog?.metadata?.pdfSize,
      smtpResponse
    }
  })
}

// Mark email as failed
export function markEmailFailed(
  logId: string, 
  errorMessage: string
): EmailLog | null {
  return updateEmailLog(logId, {
    status: 'failed',
    errorMessage
  })
}

// Increment retry count
export function incrementRetryCount(logId: string): EmailLog | null {
  const log = emailLogs.find(log => log.id === logId)
  if (!log) return null

  return updateEmailLog(logId, {
    retryCount: log.retryCount + 1,
    lastRetryAt: new Date()
  })
}

// Get email log by ID
export function getEmailLog(logId: string): EmailLog | null {
  return emailLogs.find(log => log.id === logId) || null
}

// Get email logs for invoice
export function getEmailLogsForInvoice(invoiceId: string): EmailLog[] {
  return emailLogs.filter(log => log.invoiceId === invoiceId)
}

// Get failed emails for retry
export function getFailedEmails(maxRetries: number = 3): EmailLog[] {
  return emailLogs.filter(log => 
    log.status === 'failed' && 
    log.retryCount < maxRetries
  )
}

// Get email statistics
export function getEmailStats(): {
  total: number
  sent: number
  delivered: number
  failed: number
  pending: number
  successRate: number
} {
  const total = emailLogs.length
  const sent = emailLogs.filter(log => log.status === 'sent').length
  const delivered = emailLogs.filter(log => log.status === 'delivered').length
  const failed = emailLogs.filter(log => log.status === 'failed').length
  const pending = emailLogs.filter(log => log.status === 'pending').length
  
  const successRate = total > 0 ? ((sent + delivered) / total) * 100 : 0

  return {
    total,
    sent,
    delivered,
    failed,
    pending,
    successRate: Math.round(successRate * 100) / 100
  }
}

// Export logs for debugging
export function exportEmailLogs(): EmailLog[] {
  return [...emailLogs]
}

// Clear logs (for testing)
export function clearEmailLogs(): void {
  emailLogs.length = 0
  console.log('🗑️ Cleared all email logs')
}
