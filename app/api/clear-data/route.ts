export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'

// Access global storage
declare global {
  var csvInvoices: any[] | undefined
  var csvCustomers: any[] | undefined
  var allInvoices: any[] | undefined
  var allCustomers: any[] | undefined
}

export async function POST() {
  try {
    // Clear all global storage
    global.csvInvoices = []
    global.csvCustomers = []
    global.allInvoices = []
    global.allCustomers = []

    console.log('All data cleared successfully')

    return NextResponse.json({ 
      message: 'All data cleared successfully',
      cleared: {
        csvInvoices: 0,
        csvCustomers: 0,
        allInvoices: 0,
        allCustomers: 0
      }
    })
  } catch (error) {
    console.error('Error clearing data:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
}
