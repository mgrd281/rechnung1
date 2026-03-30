export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Access global storage
declare global {
  var csvInvoices: any[] | undefined
  var allInvoices: any[] | undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceNumber } = body
    
    if (!invoiceNumber) {
      return NextResponse.json(
        { error: 'Invoice number is required' },
        { status: 400 }
      )
    }
    
    console.log('Deleting all instances of invoice number:', invoiceNumber)
    
    // Get all invoices from all sources
    const allInvoices = [
      ...(global.csvInvoices || []),
      ...(global.allInvoices || [])
    ]
    
    console.log('Total invoices before deletion:', allInvoices.length)
    
    // Find all invoices with this number
    const matchingInvoices = allInvoices.filter(invoice => {
      const number = invoice.number || invoice.invoiceNumber
      return number === invoiceNumber
    })
    
    console.log(`Found ${matchingInvoices.length} invoices with number ${invoiceNumber}:`)
    matchingInvoices.forEach(inv => {
      console.log(`- ID: ${inv.id}, Number: ${inv.number || inv.invoiceNumber}, Customer: ${inv.customerName}, Total: ${inv.total}`)
    })
    
    if (matchingInvoices.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invoice not found',
          message: `Keine Rechnungen mit Nummer ${invoiceNumber} gefunden.`
        },
        { status: 404 }
      )
    }
    
    // Remove all instances from global storage
    const idsToRemove = new Set(matchingInvoices.map(inv => inv.id))
    
    let removedFromAllInvoices = 0
    let removedFromCsvInvoices = 0
    
    if (global.allInvoices) {
      const originalLength = global.allInvoices.length
      global.allInvoices = global.allInvoices.filter(inv => !idsToRemove.has(inv.id))
      removedFromAllInvoices = originalLength - global.allInvoices.length
      console.log(`Updated allInvoices: ${originalLength} -> ${global.allInvoices.length}`)
    }
    
    if (global.csvInvoices) {
      const originalLength = global.csvInvoices.length
      global.csvInvoices = global.csvInvoices.filter(inv => !idsToRemove.has(inv.id))
      removedFromCsvInvoices = originalLength - global.csvInvoices.length
      console.log(`Updated csvInvoices: ${originalLength} -> ${global.csvInvoices.length}`)
    }
    
    console.log(`Successfully deleted ${matchingInvoices.length} invoices with number ${invoiceNumber}`)
    
    return NextResponse.json({
      success: true,
      message: `${matchingInvoices.length} Rechnung(en) mit Nummer ${invoiceNumber} erfolgreich gelöscht.`,
      deletedCount: matchingInvoices.length,
      invoiceNumber: invoiceNumber,
      removedFromAllInvoices,
      removedFromCsvInvoices,
      deletedInvoices: matchingInvoices.map(inv => ({
        id: inv.id,
        number: inv.number || inv.invoiceNumber,
        customer: inv.customerName,
        total: inv.total,
        date: inv.date
      }))
    })
    
  } catch (error) {
    console.error('Error deleting specific duplicates:', error)
    return NextResponse.json(
      { 
        error: 'Delete failed',
        message: 'Ein Fehler ist beim Löschen der Rechnungen aufgetreten'
      },
      { status: 500 }
    )
  }
}
