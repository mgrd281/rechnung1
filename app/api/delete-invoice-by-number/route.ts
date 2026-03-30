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
    
    console.log('Deleting invoice with number:', invoiceNumber)
    
    let deletedCount = 0
    
    // Delete from global.allInvoices
    if (global.allInvoices) {
      const originalLength = global.allInvoices.length
      global.allInvoices = global.allInvoices.filter(inv => {
        const shouldDelete = (inv.number === invoiceNumber || inv.invoiceNumber === invoiceNumber)
        if (shouldDelete) {
          deletedCount++
          console.log('Deleting from allInvoices:', inv.id, inv.number || inv.invoiceNumber)
        }
        return !shouldDelete
      })
      console.log(`Updated allInvoices: ${originalLength} -> ${global.allInvoices.length}`)
    }
    
    // Delete from global.csvInvoices
    if (global.csvInvoices) {
      const originalLength = global.csvInvoices.length
      global.csvInvoices = global.csvInvoices.filter(inv => {
        const shouldDelete = (inv.number === invoiceNumber || inv.invoiceNumber === invoiceNumber)
        if (shouldDelete) {
          console.log('Deleting from csvInvoices:', inv.id, inv.number || inv.invoiceNumber)
        }
        return !shouldDelete
      })
      console.log(`Updated csvInvoices: ${originalLength} -> ${global.csvInvoices.length}`)
    }
    
    if (deletedCount === 0) {
      return NextResponse.json(
        { 
          error: 'Invoice not found',
          message: `Rechnung mit Nummer ${invoiceNumber} wurde nicht gefunden.`
        },
        { status: 404 }
      )
    }
    
    console.log(`Successfully deleted ${deletedCount} invoices with number ${invoiceNumber}`)
    
    return NextResponse.json({
      success: true,
      message: `${deletedCount} Rechnung(en) mit Nummer ${invoiceNumber} erfolgreich gelöscht.`,
      deletedCount: deletedCount,
      invoiceNumber: invoiceNumber
    })
    
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { 
        error: 'Delete failed',
        message: 'Ein Fehler ist beim Löschen der Rechnung aufgetreten'
      },
      { status: 500 }
    )
  }
}
