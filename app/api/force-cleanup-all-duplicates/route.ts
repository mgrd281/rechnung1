export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Access global storage
declare global {
  var csvInvoices: any[] | undefined
  var allInvoices: any[] | undefined
}

export async function POST() {
  try {
    console.log('Starting comprehensive duplicate cleanup...')
    
    // Get all invoices from all sources
    const allInvoices = [
      ...(global.csvInvoices || []),
      ...(global.allInvoices || [])
    ]
    
    console.log('Total invoices before cleanup:', allInvoices.length)
    
    // Group invoices by multiple detection methods
    const invoiceGroups: { [key: string]: any[] } = {}
    const numberGroups: { [key: string]: any[] } = {}
    
    // First pass: Group by invoice number only (to catch exact number duplicates)
    allInvoices.forEach(invoice => {
      const number = invoice.number || invoice.invoiceNumber
      if (!numberGroups[number]) {
        numberGroups[number] = []
      }
      numberGroups[number].push(invoice)
    })
    
    // Second pass: Group by comprehensive fingerprint
    allInvoices.forEach(invoice => {
      // Create comprehensive fingerprint including customer data and total
      const number = invoice.number || invoice.invoiceNumber
      const customerName = invoice.customerName || ''
      const customerEmail = invoice.customerEmail || ''
      const total = invoice.total || 0
      const date = invoice.date || ''
      
      // Multiple fingerprint strategies
      const fingerprints = [
        // Strategy 1: Exact match
        `exact-${number}-${customerName}-${customerEmail}-${total}-${date}`,
        // Strategy 2: Number + Customer + Total (ignore date)
        `number-customer-total-${number}-${customerName}-${total}`,
        // Strategy 3: Just number (for exact number duplicates)
        `number-only-${number}`
      ]
      
      fingerprints.forEach(fingerprint => {
        if (!invoiceGroups[fingerprint]) {
          invoiceGroups[fingerprint] = []
        }
        invoiceGroups[fingerprint].push(invoice)
      })
    })
    
    // Find duplicates using number-only strategy first (most aggressive)
    const duplicates: any[] = []
    const toKeep: any[] = []
    const processedIds = new Set<string>()
    let duplicateGroups = 0
    
    // Process number-only duplicates first
    Object.entries(numberGroups).forEach(([number, invoices]) => {
      if (invoices.length > 1) {
        duplicateGroups++
        console.log(`Found ${invoices.length} invoices with same number: ${number}`)
        
        // Sort by creation date and keep the oldest
        invoices.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime()
          const dateB = new Date(b.createdAt || b.date || 0).getTime()
          return dateA - dateB
        })
        
        // Keep the first (oldest), mark others as duplicates
        const keeper = invoices[0]
        const duplicatesToRemove = invoices.slice(1)
        
        if (!processedIds.has(keeper.id)) {
          toKeep.push(keeper)
          processedIds.add(keeper.id)
          console.log(`Keeping invoice: ${keeper.id} (${keeper.number})`)
        }
        
        duplicatesToRemove.forEach(dup => {
          if (!processedIds.has(dup.id)) {
            duplicates.push(dup)
            processedIds.add(dup.id)
            console.log(`Removing duplicate: ${dup.id} (${dup.number})`)
          }
        })
      } else {
        // Single invoice with this number
        const invoice = invoices[0]
        if (!processedIds.has(invoice.id)) {
          toKeep.push(invoice)
          processedIds.add(invoice.id)
        }
      }
    })
    
    // Add any remaining invoices that weren't processed
    allInvoices.forEach(invoice => {
      if (!processedIds.has(invoice.id)) {
        toKeep.push(invoice)
        processedIds.add(invoice.id)
      }
    })
    
    console.log('Invoices to keep:', toKeep.length)
    console.log('Duplicates to remove:', duplicates.length)
    console.log('Duplicate groups found:', duplicateGroups)
    
    // Update global storage - keep only non-duplicates
    const keepIds = new Set(toKeep.map(inv => inv.id))
    
    let removedFromAllInvoices = 0
    let removedFromCsvInvoices = 0
    
    if (global.allInvoices) {
      const originalLength = global.allInvoices.length
      global.allInvoices = global.allInvoices.filter(inv => keepIds.has(inv.id))
      removedFromAllInvoices = originalLength - global.allInvoices.length
      console.log(`Updated allInvoices: ${originalLength} -> ${global.allInvoices.length}`)
    }
    
    if (global.csvInvoices) {
      const originalLength = global.csvInvoices.length
      global.csvInvoices = global.csvInvoices.filter(inv => keepIds.has(inv.id))
      removedFromCsvInvoices = originalLength - global.csvInvoices.length
      console.log(`Updated csvInvoices: ${originalLength} -> ${global.csvInvoices.length}`)
    }
    
    // Generate detailed report
    const duplicatesByNumber: { [key: string]: number } = {}
    duplicates.forEach(dup => {
      const number = dup.number || dup.invoiceNumber
      duplicatesByNumber[number] = (duplicatesByNumber[number] || 0) + 1
    })
    
    console.log('Comprehensive cleanup completed successfully')
    
    return NextResponse.json({
      success: true,
      message: `Umfassende Bereinigung abgeschlossen. ${duplicates.length} Duplikate aus ${duplicateGroups} Gruppen entfernt.`,
      summary: {
        totalInvoicesBefore: allInvoices.length,
        totalInvoicesAfter: toKeep.length,
        duplicatesRemoved: duplicates.length,
        duplicateGroups: duplicateGroups,
        removedFromAllInvoices,
        removedFromCsvInvoices
      },
      duplicatesByNumber: Object.entries(duplicatesByNumber).map(([number, count]) => ({
        invoiceNumber: number,
        duplicatesRemoved: count
      })),
      keptInvoices: toKeep.map(inv => ({
        id: inv.id,
        number: inv.number || inv.invoiceNumber,
        customer: inv.customerName,
        total: inv.total,
        date: inv.date
      }))
    })
    
  } catch (error) {
    console.error('Error during comprehensive cleanup:', error)
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: 'Ein Fehler ist bei der umfassenden Bereinigung aufgetreten'
      },
      { status: 500 }
    )
  }
}
