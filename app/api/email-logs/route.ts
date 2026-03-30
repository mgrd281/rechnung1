export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { 
  getEmailLogsForInvoice, 
  getEmailStats, 
  exportEmailLogs,
  getFailedEmails,
  incrementRetryCount
} from '@/lib/email-tracking'
import { sendInvoiceEmail } from '@/lib/email-service'

// Get email logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const stats = searchParams.get('stats')
    const failed = searchParams.get('failed')

    if (stats === 'true') {
      // Return email statistics
      const statistics = getEmailStats()
      return NextResponse.json({
        success: true,
        stats: statistics
      })
    }

    if (failed === 'true') {
      // Return failed emails for retry
      const failedEmails = getFailedEmails()
      return NextResponse.json({
        success: true,
        failedEmails
      })
    }

    if (invoiceId) {
      // Return logs for specific invoice
      const logs = getEmailLogsForInvoice(invoiceId)
      return NextResponse.json({
        success: true,
        logs
      })
    }

    // Return all logs
    const allLogs = exportEmailLogs()
    return NextResponse.json({
      success: true,
      logs: allLogs
    })

  } catch (error) {
    console.error('Error fetching email logs:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch email logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Retry failed email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, logId, invoiceId, customerEmail, customerName, invoiceNumber } = body

    if (action === 'retry') {
      if (!logId && (!invoiceId || !customerEmail || !customerName || !invoiceNumber)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields for retry: logId OR (invoiceId, customerEmail, customerName, invoiceNumber)'
          },
          { status: 400 }
        )
      }

      // Increment retry count if logId provided
      if (logId) {
        incrementRetryCount(logId)
      }

      // Retry sending email
      console.log('🔄 Retrying email send for invoice:', invoiceNumber || 'unknown')
      
      const result = await sendInvoiceEmail(
        invoiceId,
        customerEmail,
        customerName,
        invoiceNumber,
        'Karina Khrystych'
      )

      return NextResponse.json({
        success: true,
        message: 'Email retry completed',
        result
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Supported actions: retry'
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in email logs API:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process email logs request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
