export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'

// Access global storage for CSV data
declare global {
  var csvInvoices: any[] | undefined
  var csvCustomers: any[] | undefined
}

export async function GET() {
  try {
    // Initialize global storage if not exists
    if (!global.csvInvoices) {
      global.csvInvoices = []
    }
    if (!global.csvCustomers) {
      global.csvCustomers = []
    }

    console.log('CSV API - Invoices count:', global.csvInvoices.length)
    console.log('CSV API - Customers count:', global.csvCustomers.length)
    console.log('CSV API - Sample invoice:', global.csvInvoices[0])

    return NextResponse.json({
      invoices: global.csvInvoices,
      customers: global.csvCustomers,
      count: {
        invoices: global.csvInvoices.length,
        customers: global.csvCustomers.length
      }
    })
  } catch (error) {
    console.error('Error fetching CSV data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CSV data' },
      { status: 500 }
    )
  }
}
