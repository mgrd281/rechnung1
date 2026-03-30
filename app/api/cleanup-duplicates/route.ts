export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Access global storage
declare global {
  var csvInvoices: any[] | undefined
  var allInvoices: any[] | undefined
}

export async function POST() {
  try {
    console.log('Starting duplicate cleanup...')
    
    // Get all invoices
    const allInvoices = [
      ...(global.csvInvoices || []),
      ...(global.allInvoices || [])
    ]
    
    console.log('Total invoices before cleanup:', allInvoices.length)
    
    // Group invoices by number
    const invoiceGroups: { [key: string]: any[] } = {}
    
    allInvoices.forEach(invoice => {
      const number = invoice.number || invoice.invoiceNumber
      if (!invoiceGroups[number]) {
        invoiceGroups[number] = []
      }
      invoiceGroups[number].push(invoice)
    })
    
    // Find duplicates
    const duplicates: any[] = []
    const toKeep: any[] = []
    
    Object.entries(invoiceGroups).forEach(([number, invoices]) => {
      if (invoices.length > 1) {
        console.log(`Found ${invoices.length} duplicates for invoice ${number}`)
        
        // Keep the first one (oldest), mark others as duplicates
        toKeep.push(invoices[0])
        duplicates.push(...invoices.slice(1))
      } else {
        toKeep.push(invoices[0])
      }
    })
    
    console.log('Invoices to keep:', toKeep.length)
    console.log('Duplicates to remove:', duplicates.length)
    
    // Update global storage - keep only non-duplicates
    const keepIds = new Set(toKeep.map(inv => inv.id))
    
    if (global.allInvoices) {
      const originalLength = global.allInvoices.length
      global.allInvoices = global.allInvoices.filter(inv => keepIds.has(inv.id))
      console.log(`Updated allInvoices: ${originalLength} -> ${global.allInvoices.length}`)
    }
    
    if (global.csvInvoices) {
      const originalLength = global.csvInvoices.length
      global.csvInvoices = global.csvInvoices.filter(inv => keepIds.has(inv.id))
      console.log(`Updated csvInvoices: ${originalLength} -> ${global.csvInvoices.length}`)
    }
    
    
    console.log('Cleanup completed successfully')
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Removed ${duplicates.length} duplicate invoices.`,
      duplicatesRemoved: duplicates.length,
      invoicesKept: toKeep.length,
      duplicateNumbers: Array.from(new Set(duplicates.map(d => d.number || d.invoiceNumber)))
    })
    
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: 'Ein Fehler ist beim Bereinigen der Duplikate aufgetreten'
      },
      { status: 500 }
    )
  }
}
