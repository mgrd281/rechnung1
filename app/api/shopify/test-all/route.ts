export const dynamic = "force-dynamic"
// API zum Testen aller Shopify-Endpunkte
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  }

  // Test 1: Original Import API
  try {
    const response1 = await fetch(`${request.nextUrl.origin}/api/shopify/import?limit=2&financial_status=paid`)
    const data1 = await response1.json()
    results.tests.push({
      name: 'Original Import API',
      endpoint: '/api/shopify/import',
      status: response1.status,
      success: data1.success,
      ordersCount: data1.orders?.length || 0,
      error: data1.error || null
    })
  } catch (error) {
    results.tests.push({
      name: 'Original Import API',
      endpoint: '/api/shopify/import',
      status: 'ERROR',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Legacy Import API
  try {
    const response2 = await fetch(`${request.nextUrl.origin}/api/shopify/legacy-import?limit=2&financial_status=paid`)
    const data2 = await response2.json()
    results.tests.push({
      name: 'Legacy Import API',
      endpoint: '/api/shopify/legacy-import',
      status: response2.status,
      success: data2.success,
      ordersCount: data2.orders?.length || 0,
      error: data2.error || null
    })
  } catch (error) {
    results.tests.push({
      name: 'Legacy Import API',
      endpoint: '/api/shopify/legacy-import',
      status: 'ERROR',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Direct Shopify Connection
  try {
    const shopifyResponse = await fetch(`https://45dv93-bk.myshopify.com/admin/api/2030-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': 'SHOPIFY_ACCESS_TOKEN_PLACEHOLDER',
        'Content-Type': 'application/json'
      }
    })
    const shopifyData = await shopifyResponse.json()
    results.tests.push({
      name: 'Direct Shopify Connection',
      endpoint: 'https://45dv93-bk.myshopify.com/admin/api/2030-01/shop.json',
      status: shopifyResponse.status,
      success: shopifyResponse.ok,
      shopName: shopifyData.shop?.name || null,
      error: shopifyResponse.ok ? null : 'Connection failed'
    })
  } catch (error) {
    results.tests.push({
      name: 'Direct Shopify Connection',
      endpoint: 'https://45dv93-bk.myshopify.com/admin/api/2030-01/shop.json',
      status: 'ERROR',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
