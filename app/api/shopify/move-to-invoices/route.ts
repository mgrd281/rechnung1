export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getShopifySettings } from '@/lib/shopify-settings'
import { ShopifyAPI, convertShopifyOrderToInvoice } from '@/lib/shopify-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderIds }:{ orderIds: number[] } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: 'orderIds ist erforderlich' }, { status: 400 })
    }

    const settings = getShopifySettings()
    if (!settings.enabled) {
      return NextResponse.json({ success: false, error: 'Shopify Integration ist nicht aktiviert' }, { status: 400 })
    }

    const api = new ShopifyAPI(settings)

    const results: Array<{ orderId: number; success: boolean; invoice?: any; error?: string; pdfUrl?: string }> = []

    for (const orderId of orderIds) {
      try {
        const order = await api.getOrder(orderId)
        if (!order) {
          results.push({ orderId, success: false, error: `Bestellung ${orderId} nicht gefunden` })
          continue
        }

        const invoiceData = convertShopifyOrderToInvoice(order, settings)
        console.log('🔍 Converted invoice data for order', orderId, ':', {
          number: invoiceData.number,
          customer: invoiceData.customer,
          items: invoiceData.items?.length,
          total: invoiceData.total
        })

        const requestBody = {
          invoiceNumber: invoiceData.number,
          date: invoiceData.date,
          dueDate: invoiceData.dueDate,
          taxRate: invoiceData.taxRate,
          customer: invoiceData.customer,
          items: invoiceData.items,
          subtotal: invoiceData.subtotal,
          taxAmount: invoiceData.taxAmount,
          total: invoiceData.total,
          // Linkage
          shopifyOrderId: order.id,
          shopifyOrderNumber: order.name,
          source: 'shopify'
        }
        
        console.log('📤 Creating invoice with request body:', JSON.stringify(requestBody, null, 2))
        
        // Create invoice via existing invoices API (use correct port)
        // Forward authentication headers from the original request
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        
        // Copy all authentication-related headers from the original request
        const authHeader = request.headers.get('authorization')
        const cookieHeader = request.headers.get('cookie')
        const userInfoHeader = request.headers.get('x-user-info')
        
        if (authHeader) {
          authHeaders['authorization'] = authHeader
        }
        if (cookieHeader) {
          authHeaders['cookie'] = cookieHeader
        }
        if (userInfoHeader) {
          authHeaders['x-user-info'] = userInfoHeader
        }
        
        const resp = await fetch(`http://127.0.0.1:3000/api/invoices`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(requestBody)
        })
        
        console.log('📥 Invoice API response status:', resp.status, resp.statusText)

        if (!resp.ok) {
          const errorText = await resp.text()
          console.error('❌ Invoice creation failed for order', orderId, ':', errorText)
          results.push({ orderId, success: false, error: `Fehler beim Erstellen der Rechnung: ${errorText}` })
          continue
        }

        const created = await resp.json()
        console.log('✅ Invoice created successfully for order', orderId, ':', created.number || created.id)

        // Provide a PDF URL for convenience (Shopify order PDF)
        const pdfUrl = `/api/shopify/order-pdf?id=${order.id}`

        results.push({ orderId, success: true, invoice: created, pdfUrl })
      } catch (err:any) {
        results.push({ orderId, success: false, error: err?.message || 'Unbekannter Fehler' })
      }
    }

    const imported = results.filter(r => r.success).length
    const failed = results.length - imported

    return NextResponse.json({ success: true, imported, failed, results })
  } catch (error:any) {
    console.error('Error in move-to-invoices:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unbekannter Fehler' }, { status: 500 })
  }
}
