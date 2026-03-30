export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Access global storage for data
declare global {
  var csvInvoices: any[] | undefined
  var csvCustomers: any[] | undefined
  var allInvoices: any[] | undefined
  var allCustomers: any[] | undefined
}

// No mock customers - all data comes from invoices and global storage

// Extract unique customers from invoices
function extractCustomersFromInvoices(invoices: any[]): any[] {
  const customerMap = new Map()
  
  invoices.forEach(invoice => {
    if (!invoice.deleted_at) { // Skip soft-deleted invoices
      let customerEmail = ''
      let customerName = ''
      
      // Handle different invoice data structures
      if (invoice.customer) {
        customerEmail = invoice.customer.email || invoice.customerEmail || ''
        customerName = invoice.customer.name || invoice.customerName || ''
      } else {
        customerEmail = invoice.customerEmail || invoice.email || ''
        customerName = invoice.customerName || invoice.name || ''
      }
      
      // Only process if we have a valid email
      if (customerEmail && customerEmail.includes('@')) {
        const customerId = customerEmail.toLowerCase().trim()
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: customerName || 'Unbekannter Kunde',
            email: customerEmail,
            phone: invoice.customer?.phone || invoice.customerPhone || '',
            address: invoice.customer?.address || invoice.customerAddress || '',
            invoiceCount: 0,
            totalAmount: 0,
            invoices: []
          })
        }
        
        const customer = customerMap.get(customerId)
        // Only add invoice if it's not already there
        const existingInvoice = customer.invoices.find((inv: any) => inv.id === invoice.id)
        if (!existingInvoice) {
          customer.invoiceCount++
          customer.totalAmount += invoice.total || 0
          customer.invoices.push({
            id: invoice.id,
            number: invoice.number || invoice.invoiceNumber,
            date: invoice.date,
            total: invoice.total,
            status: invoice.status
          })
        }
      }
    }
  })
  
  // Format total amounts
  return Array.from(customerMap.values()).map(customer => ({
    ...customer,
    totalAmount: `€${customer.totalAmount.toFixed(2)}`
  }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const query = searchParams.get('q') // General search query
    
    // Get all invoices from different sources
    const allInvoices = [
      ...(global.csvInvoices || []),
      ...(global.allInvoices || [])
    ]
    
    console.log(`[GET] Data sources - CSV invoices: ${global.csvInvoices?.length || 0}, Manual invoices: ${global.allInvoices?.length || 0}`)
    
    // Extract customers from invoices
    const invoiceCustomers = extractCustomersFromInvoices(allInvoices)
    
    // Combine all customers (no mock data)
    const allCustomers = [
      ...invoiceCustomers,
      ...(global.csvCustomers || []),
      ...(global.allCustomers || [])
    ]
    
    console.log(`[GET] Customer sources - From invoices: ${invoiceCustomers.length}, CSV customers: ${global.csvCustomers?.length || 0}, Manual customers: ${global.allCustomers?.length || 0}`)
    
    // Remove duplicates FIRST based on email (this is the main issue!)
    const uniqueCustomers = allCustomers.reduce((acc, customer) => {
      if (!customer.email) return acc // Skip customers without email
      
      const emailLower = customer.email.toLowerCase()
      const existingIndex = acc.findIndex((c: any) => c.email?.toLowerCase() === emailLower)
      
      if (existingIndex === -1) {
        acc.push({
          ...customer,
          invoices: customer.invoices || []
        })
      } else {
        // Merge data if duplicate found (prefer more complete data)
        const existing = acc[existingIndex]
        acc[existingIndex] = {
          ...existing,
          ...customer,
          invoiceCount: Math.max(existing.invoiceCount || 0, customer.invoiceCount || 0),
          invoices: [...(existing.invoices || []), ...(customer.invoices || [])].filter((invoice, index, arr) => 
            arr.findIndex(inv => inv.id === invoice.id) === index // Remove duplicate invoices too
          )
        }
      }
      return acc
    }, [] as any[])

    let filteredCustomers = uniqueCustomers
    
    // Filter by email if provided (use contains for partial matches)
    if (email) {
      const emailLower = email.toLowerCase().trim()
      console.log(`[GET] Filtering by email: "${emailLower}"`)
      filteredCustomers = uniqueCustomers.filter((customer: any) => {
        const customerEmail = customer.email?.toLowerCase() || ''
        const matches = customerEmail.includes(emailLower)
        if (matches) {
          console.log(`[GET] Found match: ${customer.email}`)
        }
        return matches
      })
    }
    
    // Filter by general query if provided
    if (query && !email) {
      const queryLower = query.toLowerCase().trim()
      console.log(`[GET] Filtering by query: "${queryLower}"`)
      filteredCustomers = uniqueCustomers.filter((customer: any) => {
        const emailMatch = customer.email && customer.email.toLowerCase().includes(queryLower)
        const nameMatch = customer.name && customer.name.toLowerCase().includes(queryLower)
        const phoneMatch = customer.phone && customer.phone.includes(queryLower)
        
        if (emailMatch || nameMatch || phoneMatch) {
          console.log(`[GET] Found match: ${customer.email} (${customer.name})`)
        }
        
        return emailMatch || nameMatch || phoneMatch
      })
    }
    
    console.log(`Customer search - Query: "${email || query}"`)
    console.log(`Total customers before filtering: ${allCustomers.length}`)
    console.log(`Unique customers after deduplication: ${uniqueCustomers.length}`)
    console.log(`Filtered customers: ${filteredCustomers.length}`)
    
    // Debug: Log first few customers for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Sample customers:', uniqueCustomers.slice(0, 3).map((c: any) => ({ 
        email: c.email, 
        name: c.name, 
        source: c.source || 'unknown' 
      })))
      
      // If searching for specific email, check if it exists in any form
      if (email) {
        const emailLower = email.toLowerCase().trim()
        const allEmails = uniqueCustomers.map((c: any) => c.email?.toLowerCase()).filter(Boolean)
        console.log(`Searching for: "${emailLower}"`)
        console.log(`Available emails:`, allEmails.slice(0, 5))
        console.log(`Email exists in data:`, allEmails.some((e: string) => e.includes(emailLower)))
      }
    }
    
    return NextResponse.json({
      success: true,
      customers: filteredCustomers,
      total: filteredCustomers.length,
      query: email || query || ''
    })
    
  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Fehler beim Suchen der Kunden',
        customers: [],
        total: 0
      },
      { status: 500 }
    )
  }
}

// POST endpoint for advanced search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, phone, includeInvoices = false } = body
    
    // Get all invoices from different sources
    const allInvoices = [
      ...(global.csvInvoices || []),
      ...(global.allInvoices || [])
    ]
    
    // Extract customers from invoices
    const invoiceCustomers = extractCustomersFromInvoices(allInvoices)
    
    // Combine all customers (no mock data)
    const allCustomers = [
      ...invoiceCustomers,
      ...(global.csvCustomers || []),
      ...(global.allCustomers || [])
    ]
    
    // Advanced filtering
    let filteredCustomers = allCustomers
    
    if (email) {
      const emailLower = email.toLowerCase().trim()
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.email && customer.email.toLowerCase().includes(emailLower)
      )
    }
    
    if (name) {
      const nameLower = name.toLowerCase().trim()
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name && customer.name.toLowerCase().includes(nameLower)
      )
    }
    
    if (phone) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.phone && customer.phone.includes(phone.trim())
      )
    }
    
    // Remove duplicates based on email
    const uniqueCustomers = filteredCustomers.reduce((acc, customer) => {
      const existingIndex = acc.findIndex((c: any) => c.email?.toLowerCase() === customer.email?.toLowerCase())
      if (existingIndex === -1) {
        acc.push(customer)
      }
      return acc
    }, [] as any[])
    
    // Include detailed invoice information if requested
    if (includeInvoices) {
      for (const customer of uniqueCustomers) {
        const customerInvoices = allInvoices.filter(invoice => {
          const invoiceEmail = invoice.customer?.email || invoice.customerEmail || invoice.email || ''
          return invoiceEmail.toLowerCase() === customer.email?.toLowerCase() && !invoice.deleted_at
        })
        
        customer.detailedInvoices = customerInvoices.map(invoice => ({
          id: invoice.id,
          number: invoice.number || invoice.invoiceNumber,
          date: invoice.date,
          dueDate: invoice.dueDate,
          total: invoice.total,
          status: invoice.status,
          items: invoice.items || []
        }))
      }
    }
    
    console.log(`Advanced customer search - Found: ${uniqueCustomers.length} customers`)
    
    return NextResponse.json({
      success: true,
      customers: uniqueCustomers,
      total: uniqueCustomers.length,
      searchCriteria: { email, name, phone, includeInvoices }
    })
    
  } catch (error) {
    console.error('Error in advanced customer search:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Fehler bei der erweiterten Kundensuche',
        customers: [],
        total: 0
      },
      { status: 500 }
    )
  }
}
