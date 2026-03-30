export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Debug endpoint to check what customer data is available
export async function GET(request: NextRequest) {
  try {
    // Access global storage for data
    const csvInvoices = global.csvInvoices || []
    const allInvoices = global.allInvoices || []
    const csvCustomers = global.csvCustomers || []
    const allCustomers = global.allCustomers || []

    // Extract emails from invoices
    const emailsFromInvoices = [...csvInvoices, ...allInvoices]
      .filter(invoice => !invoice.deleted_at)
      .map(invoice => {
        let email = ''
        if (invoice.customer) {
          email = invoice.customer.email || invoice.customerEmail || ''
        } else {
          email = invoice.customerEmail || invoice.email || ''
        }
        return {
          email: email,
          name: invoice.customer?.name || invoice.customerName || '',
          invoiceId: invoice.id,
          invoiceNumber: invoice.number || invoice.invoiceNumber
        }
      })
      .filter(item => item.email && item.email.includes('@'))

    // Get unique emails
    const emailSet = new Set(emailsFromInvoices.map(item => item.email.toLowerCase()))
    const uniqueEmails = Array.from(emailSet)

    return NextResponse.json({
      success: true,
      debug: {
        csvInvoicesCount: csvInvoices.length,
        allInvoicesCount: allInvoices.length,
        csvCustomersCount: csvCustomers.length,
        allCustomersCount: allCustomers.length,
        totalEmailsFromInvoices: emailsFromInvoices.length,
        uniqueEmailsCount: uniqueEmails.length,
        sampleEmails: uniqueEmails.slice(0, 10),
        sampleInvoiceData: emailsFromInvoices.slice(0, 5)
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      debug: null
    }, { status: 500 })
  }
}
