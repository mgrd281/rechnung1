export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Shopify settings interface
interface ShopifySettings {
  enabled: boolean
  shopDomain: string
  accessToken: string
  apiVersion: string
  autoImport: boolean
  importInterval: number
  lastImport?: string
  defaultTaxRate: number
  defaultPaymentTerms: number
}

// Get Shopify settings (fallback implementation)
function getShopifySettings(): ShopifySettings {
  // Try to read from reliable storage first
  try {
    const fs = require('fs')
    const path = require('path')

    // Check /tmp first (Vercel)
    const tmpPath = path.join('/tmp', 'shopify-settings.json')
    if (fs.existsSync(tmpPath)) {
      const data = fs.readFileSync(tmpPath, 'utf8')
      const settings = JSON.parse(data)
      if (settings.shopDomain) settings.shopDomain = settings.shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim()
      if (settings.accessToken) settings.accessToken = settings.accessToken.trim()
      return settings
    }

    // Check local user-storage (Local Development)
    const localPath = path.join(process.cwd(), 'user-storage', 'shopify-settings.json')
    if (fs.existsSync(localPath)) {
      const data = fs.readFileSync(localPath, 'utf8')
      const settings = JSON.parse(data)
      if (settings.shopDomain) settings.shopDomain = settings.shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim()
      if (settings.accessToken) settings.accessToken = settings.accessToken.trim()
      return settings
    }
  } catch (e) {
    console.warn('⚠️ Could not load settings from storage in import route:', e)
  }

  const settings = {
    enabled: true,
    shopDomain: (process.env.SHOPIFY_SHOP_DOMAIN || '45dv93-bk.myshopify.com').replace(/^https?:\/\//, '').replace(/\/$/, '').trim(),
    accessToken: (process.env.SHOPIFY_ACCESS_TOKEN || 'SHOPIFY_ACCESS_TOKEN_PLACEHOLDER').trim(),
    apiVersion: '2024-10',
    autoImport: false,
    importInterval: 60,
    defaultTaxRate: 19,
    defaultPaymentTerms: 14
  }

  // Validate settings
  if (!settings.shopDomain || !settings.accessToken) {
    console.error('❌ Missing Shopify credentials:', {
      hasShopDomain: !!settings.shopDomain,
      hasAccessToken: !!settings.accessToken
    })
  }

  return settings
}

// Simple Shopify API implementation
async function fetchShopifyOrders(settings: ShopifySettings, params: any) {
  // Valid top-level fields only - Nested syntax like customer[id] is NOT valid for 'fields' param
  const validFields = [
    'id', 'name', 'email', 'created_at', 'updated_at', 'total_price', 'subtotal_price', 'total_tax',
    'currency', 'financial_status', 'fulfillment_status', 'note', 'note_attributes',
    'customer', 'billing_address', 'shipping_address', 'line_items', 'tax_lines'
  ].join(',')

  const urlParams = new URLSearchParams({
    limit: Math.min(params.limit || 250, 250).toString(), // Shopify maximum is 250
    status: 'any',  // CRITICAL: Required to get all orders!
    fields: validFields
  })

  // FIXED: Always add financial_status, use 'paid' as default
  if (params.financial_status && params.financial_status !== 'any') {
    urlParams.append('financial_status', params.financial_status)
  } else {
    urlParams.append('financial_status', 'paid')
  }

  // Add date filters if provided
  if (params.created_at_min) {
    urlParams.append('created_at_min', params.created_at_min)
  }
  if (params.created_at_max) {
    urlParams.append('created_at_max', params.created_at_max)
  }

  const url = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders.json?${urlParams}`

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': settings.accessToken,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.orders || []
}

// UNLIMITED Shopify API implementation with cursor pagination
async function fetchShopifyOrdersUnlimited(settings: ShopifySettings, params: any) {
  console.log('🚀 Starting UNLIMITED fetch with cursor pagination')
  console.log('📋 Input params:', params)

  let allOrders: any[] = []
  let cursor: string | undefined
  let hasNextPage = true
  let pageCount = 0
  const maxPages = Math.min(Math.ceil(params.limit / 250) || 10000, 10000) // Maximal 10000 Seiten (2.5 Million Orders)

  console.log(`📊 Planning to fetch max ${maxPages} pages  // UNLIMITED fetch with cursor-based pagination - NO LIMIT!`)
  while (hasNextPage && pageCount < 10000) { // Maximum 10000 pages × 250 = 2,500,000 orders
    pageCount++
    console.log(`📄 Fetching page ${pageCount}/${maxPages}`)

    const urlParams = new URLSearchParams({
      limit: '250' // Shopify Maximum per page
    })

    // CRITICAL: Shopify API doesn't allow other parameters when page_info is present
    if (cursor) {
      // Only page_info when paginating
      urlParams.append('page_info', cursor)
    } else {
      // Only add filters on first request (no cursor)
      urlParams.append('status', 'any')  // CRITICAL: Required to get all orders!
      urlParams.append('fields', 'id,name,email,created_at,updated_at,total_price,subtotal_price,total_tax,currency,financial_status,fulfillment_status,note,note_attributes,customer,billing_address,shipping_address,line_items,tax_lines')

      // Add financial_status filter
      if (params.financial_status && params.financial_status !== 'any') {
        urlParams.append('financial_status', params.financial_status)
      } else {
        urlParams.append('financial_status', 'any')
        console.log('🔧 Using status=any + financial_status=any for MAXIMUM results')
      }

      // Add date filters only if they're valid ISO strings  
      if (params.created_at_min) {
        try {
          const date = new Date(params.created_at_min)
          if (!isNaN(date.getTime())) {
            urlParams.append('created_at_min', params.created_at_min)
          } else {
            console.warn('⚠️ Invalid created_at_min date format:', params.created_at_min)
          }
        } catch (e) {
          console.warn('⚠️ Error parsing created_at_min date:', params.created_at_min, e)
        }
      }

      if (params.created_at_max) {
        try {
          const date = new Date(params.created_at_max)
          if (!isNaN(date.getTime())) {
            urlParams.append('created_at_max', params.created_at_max)
          } else {
            console.warn('⚠️ Invalid created_at_max date format:', params.created_at_max)
          }
        } catch (e) {
          console.warn('⚠️ Error parsing created_at_max date:', params.created_at_max, e)
        }
      }
    }

    console.log(`📋 Page ${pageCount} URL params:`, urlParams.toString())

    const url = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders.json?${urlParams}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': settings.accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Shopify API Error ${response.status}:`, errorText)

        if (response.status === 429) {
          console.log('⏳ Rate limited, waiting 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        if (response.status === 400) {
          console.error('❌ Bad Request - Invalid parameters:', {
            url,
            params: urlParams.toString()
          })
        }

        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      const orders = data.orders || []

      allOrders.push(...orders)
      console.log(`📦 Page ${pageCount}: ${orders.length} orders (Total: ${allOrders.length})`)

      // Check for next page using Link header
      const linkHeader = response.headers.get('Link')
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1])
          cursor = nextUrl.searchParams.get('page_info') || undefined
          hasNextPage = !!cursor
        } else {
          hasNextPage = false
        }
      } else {
        hasNextPage = orders.length === 250 // If less than 250, no more pages
      }

      // Rate limiting: small delay between requests
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (error) {
      console.error(`❌ Error fetching page ${pageCount}:`, error)
      console.error(`❌ URL was:`, url)
      console.error(`❌ Params were:`, urlParams.toString())
      throw error
    }
  }

  console.log(`🎉 UNLIMITED fetch completed: ${allOrders.length} total orders from ${pageCount} pages`)

  // Get total count from Shopify API for accurate UI display
  let totalCount = allOrders.length
  try {
    const countParams = new URLSearchParams()
    if (params.financial_status && params.financial_status !== 'any') {
      countParams.append('financial_status', params.financial_status)
    }
    if (params.created_at_min) {
      countParams.append('created_at_min', params.created_at_min)
    }
    if (params.created_at_max) {
      countParams.append('created_at_max', params.created_at_max)
    }

    const countUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders/count.json?${countParams}`
    const countResponse = await fetch(countUrl, {
      headers: {
        'X-Shopify-Access-Token': settings.accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (countResponse.ok) {
      const countData = await countResponse.json()
      totalCount = countData.count || allOrders.length
      console.log(`📊 Total orders available: ${totalCount} (fetched: ${allOrders.length})`)
    }
  } catch (countError) {
    console.warn('⚠️ Could not get total count, using fetched count:', countError)
  }

  return { orders: allOrders, totalCount }
}

// Test Shopify connection
async function testShopifyConnection(settings: ShopifySettings) {
  try {
    const response = await fetch(`https://${settings.shopDomain}/admin/api/${settings.apiVersion}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': settings.accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return { success: false, message: `Connection failed: ${response.status} ${response.statusText}` }
    }

    return { success: true, message: 'Connection successful' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// POST: Import orders from Shopify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      limit = 25000, // Erhöht von 50 auf 25000 für bessere Performance
      financial_status = 'any', // Geändert von 'paid' zu 'any' um alle Bestellungen zu importieren
      created_at_min,
      created_at_max
    } = body

    console.log('📥 Shopify Import Request:')
    console.log(`   Limit: ${limit}`)
    console.log(`   Financial Status: ${financial_status}`)
    console.log(`   Date Range: ${created_at_min} bis ${created_at_max}`)

    const settings = getShopifySettings()

    if (!settings.enabled) {
      return NextResponse.json({
        success: false,
        error: 'Shopify Integration ist nicht aktiviert'
      }, { status: 400 })
    }

    // Prepare import parameters
    const importParams = {
      ...settings,
      limit,
      financial_status,
      created_at_min,
      created_at_max
    }

    console.log('🚀 Starting import with parameters:', importParams)

    // Fetch orders from Shopify using UNLIMITED function
    const fetchResult = await fetchShopifyOrdersUnlimited(settings, importParams)
    const orders = fetchResult.orders
    const totalCount = fetchResult.totalCount

    console.log(`📦 Fetched ${orders.length} orders from Shopify (Total available: ${totalCount})`)

    // For now, just return the orders (import functionality can be added later)
    const apiResult = {
      success: true,
      imported: 0,
      skipped: orders.length,
      errors: [],
      orders: orders,
      totalCount: totalCount,
      fetchedCount: orders.length
    }

    return NextResponse.json({
      success: apiResult.success,
      imported: apiResult.imported,
      skipped: apiResult.skipped,
      errors: apiResult.errors,
      totalCount: apiResult.totalCount,
      fetchedCount: apiResult.fetchedCount,
      orders: apiResult.orders.map((order: any) => {
        // Robust customer fallbacks
        const firstName = order.customer?.first_name || order.billing_address?.first_name || ''
        const lastName = order.customer?.last_name || order.billing_address?.last_name || ''
        let customerName = `${firstName} ${lastName}`.trim()
        if (!customerName) {
          customerName = order.billing_address?.company ||
            order.customer?.email ||
            order.email ||
            (order.customer?.id ? `Shopify Kunde #${order.customer.id}` : 'Unbekannt')
        }
        const customerEmail = order.customer?.email || order.email || ''

        // Map line item details for preview/debugging
        const line_items = (order.line_items || []).map((li: any) => ({
          id: li.id,
          title: li.title,
          quantity: li.quantity,
          price: li.price,
          sku: li.sku || '',
          tax_lines: (li.tax_lines || []).map((t: any) => ({ title: t.title, rate: t.rate, price: t.price }))
        }))
        const tax_lines = (order.tax_lines || []).map((t: any) => ({ title: t.title, rate: t.rate, price: t.price }))

        return {
          id: order.id,
          name: order.name,
          email: order.email,
          total_price: order.total_price,
          currency: order.currency,
          created_at: order.created_at,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          customer: {
            name: customerName,
            email: customerEmail
          },
          line_items_count: order.line_items?.length || 0,
          line_items,
          tax_lines
        }
      })
    })
  } catch (error) {
    console.error('Error importing Shopify orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Importieren der Shopify-Bestellungen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}

// GET: Get available orders from Shopify (preview)
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/shopify/import - Starting request')

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25000')
    const financial_status = searchParams.get('financial_status') || 'any'
    const created_at_min = searchParams.get('created_at_min')
    const created_at_max = searchParams.get('created_at_max')

    console.log('📅 Shopify API Request Parameters:')
    console.log(`   Limit: ${limit}`)
    console.log(`   Financial Status: ${financial_status}`)
    console.log(`   Date Range: ${created_at_min} bis ${created_at_max}`)

    console.log('⚙️ Loading Shopify settings...')
    const settings = getShopifySettings()
    console.log('⚙️ Settings loaded:', {
      enabled: settings.enabled,
      shopDomain: settings.shopDomain,
      hasAccessToken: !!settings.accessToken,
      apiVersion: settings.apiVersion
    })

    if (!settings.enabled) {
      console.log('❌ Shopify integration is disabled')
      return NextResponse.json({
        success: false,
        error: 'Shopify Integration ist nicht aktiviert'
      }, { status: 400 })
    }

    // Test connection first
    console.log('🔗 Testing Shopify connection...')
    const connectionTest = await testShopifyConnection(settings)
    console.log('🔗 Connection test result:', connectionTest)

    if (!connectionTest.success) {
      console.error('❌ Shopify connection failed:', connectionTest.message)
      return NextResponse.json({
        success: false,
        error: `Shopify Verbindung fehlgeschlagen: ${connectionTest.message}`
      }, { status: 400 })
    }

    // Prepare order query parameters - UNLIMITED IMPORT
    const orderParams = {
      limit: Math.min(limit, 1000000), // 1 Million Bestellungen für unlimited import
      financial_status,
      created_at_min,
      created_at_max
    }

    console.log('🔍 Fetching orders with UNLIMITED parameters:', orderParams)
    console.log('🚀 Using UNLIMITED import mode for Legacy system')

    // Get orders with unlimited pagination
    console.log('🚀 Starting unlimited fetch...')
    let orders: any[] = []
    let totalCount = 0

    try {
      console.log('🚀 Attempting unlimited fetch with cursor pagination...')
      console.log('📋 Order params for unlimited fetch:', orderParams)

      // Force the correct parameters for unlimited fetch (respect Shopify's 250 limit per page)
      const unlimitedParams = {
        ...orderParams,
        limit: 250 // Shopify maximum per page, unlimited via pagination
      }

      const unlimitedResult = await fetchShopifyOrdersUnlimited(settings, unlimitedParams)
      orders = unlimitedResult.orders
      totalCount = unlimitedResult.totalCount
      console.log(`✅ UNLIMITED fetch SUCCESS: ${orders.length} orders fetched! (Total available: ${totalCount})`)
    } catch (error) {
      console.error('❌ Unlimited fetch failed, details:', error)
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
      console.log('🔄 Falling back to regular fetch with enhanced parameters...')

      // Enhanced fallback with correct parameters
      try {
        const fallbackParams = {
          ...orderParams,
          limit: 250 // Shopify maximum per request
        }
        orders = await fetchShopifyOrders(settings, fallbackParams)
        console.log(`⚠️ Enhanced fallback completed: ${orders.length} orders`)

        // If we got exactly 250, there might be more - try multiple pages manually
        if (orders.length === 250) {
          console.log('🔄 Trying to fetch more pages manually...')
          try {
            const page2Params = { ...fallbackParams, created_at_max: orders[249].created_at }
            const page2Orders = await fetchShopifyOrders(settings, page2Params)
            if (page2Orders.length > 0) {
              orders = [...orders, ...page2Orders]
              console.log(`📈 Added page 2: Total now ${orders.length} orders`)
            }
          } catch (page2Error) {
            console.log('⚠️ Page 2 fetch failed, continuing with page 1 results')
          }
        }

      } catch (fallbackError) {
        console.error('❌ Both fetch methods failed!')
        console.error('  - Unlimited fetch error:', error instanceof Error ? error.message : 'Unknown error')
        console.error('  - Unlimited fetch stack:', error instanceof Error ? error.stack : 'No stack')
        console.error('  - Fallback fetch error:', fallbackError instanceof Error ? fallbackError.message : 'Unknown error')
        console.error('  - Fallback fetch stack:', fallbackError instanceof Error ? fallbackError.stack : 'No stack')
        throw new Error(`Beide Fetch-Methoden fehlgeschlagen. Unlimited: ${error instanceof Error ? error.message : 'Unknown'}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`)
      }
    }

    // Get total count from Shopify API for better UI display (if not already set by unlimited fetch)
    if (totalCount === 0) {
      totalCount = orders.length
      try {
        const countParams = new URLSearchParams()
        if (orderParams.financial_status && orderParams.financial_status !== 'any') {
          countParams.append('financial_status', orderParams.financial_status)
        }
        if (orderParams.created_at_min) {
          countParams.append('created_at_min', orderParams.created_at_min)
        }
        if (orderParams.created_at_max) {
          countParams.append('created_at_max', orderParams.created_at_max)
        }

        const countUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders/count.json?${countParams}`
        const countResponse = await fetch(countUrl, {
          headers: {
            'X-Shopify-Access-Token': settings.accessToken,
            'Content-Type': 'application/json'
          }
        })

        if (countResponse.ok) {
          const countData = await countResponse.json()
          totalCount = countData.count || orders.length
          console.log(`📊 Total orders available: ${totalCount} (fetched: ${orders.length})`)
        }
      } catch (countError) {
        console.warn('⚠️ Could not get total count, using fetched count:', countError)
      }
    }

    return NextResponse.json({
      success: true,
      totalCount: totalCount, // Gesamtanzahl für Frontend-Anzeige
      fetchedCount: orders.length, // Tatsächlich geladene Anzahl
      orders: orders.map((order: any) => {
        // Robust customer fallbacks (name + email)
        const firstName = order.customer?.first_name || order.billing_address?.first_name || ''
        const lastName = order.customer?.last_name || order.billing_address?.last_name || ''
        let customerName = `${firstName} ${lastName}`.trim()
        if (!customerName) {
          customerName = order.billing_address?.company ||
            order.customer?.email ||
            order.email ||
            (order.customer?.id ? `Shopify Kunde #${order.customer.id}` : 'Unbekannt')
        }
        const customerEmail = order.customer?.email || order.email || ''

        // Map line items for preview (titles, qty, unit price, sku, tax)
        const line_items = (order.line_items || []).map((li: any) => ({
          id: li.id,
          title: li.title,
          quantity: li.quantity,
          price: li.price, // per-unit gross price as string
          sku: li.sku || '',
          tax_lines: (li.tax_lines || []).map((t: any) => ({ title: t.title, rate: t.rate, price: t.price }))
        }))

        // Aggregate order-level taxes (if present)
        const tax_lines = (order.tax_lines || []).map((t: any) => ({ title: t.title, rate: t.rate, price: t.price }))

        return {
          id: order.id,
          name: order.name,
          email: order.email,
          total_price: order.total_price,
          currency: order.currency,
          created_at: order.created_at,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          customer: {
            name: customerName,
            email: customerEmail
          },
          line_items_count: order.line_items?.length || 0,
          line_items,
          tax_lines
        }
      })
    })
  } catch (error) {
    console.error('Error fetching Shopify orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Abrufen der Shopify-Bestellungen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
