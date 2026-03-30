import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { ShopifyAPI, convertShopifyOrderToInvoice } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json({ success: false, error: 'Missing order id' }, { status: 400 })
    }

    const orderId = parseInt(idParam, 10)
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order id' }, { status: 400 })
    }

    const settings = getShopifySettings()
    if (!settings.enabled) {
      return NextResponse.json({ success: false, error: 'Shopify Integration ist nicht aktiviert' }, { status: 400 })
    }

    const api = new ShopifyAPI(settings)

    // Fetch the order from Shopify
    const order = await api.getOrder(orderId)
    if (!order) {
      return NextResponse.json({ success: false, error: `Bestellung ${orderId} nicht gefunden` }, { status: 404 })
    }

    // Convert order to our invoice structure
    const invoice = convertShopifyOrderToInvoice(order, settings)
    console.log('🧾 Shopify → Invoice customer mapping:', {
      orderId: order.id,
      name: invoice.customer?.name,
      email: invoice.customer?.email,
      address: invoice.customer?.address,
      address2: invoice.customer?.address2,
      zipCode: invoice.customer?.zipCode,
      city: invoice.customer?.city,
      country: invoice.customer?.country,
      countryCode: invoice.customer?.countryCode
    })

    // Generate PDF using Arizona generator
    const doc = await generateArizonaPDF(invoice as any)
    const arrayBuffer = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(arrayBuffer)

    const customerName = (invoice.customer?.name || 'Kunde').replace(/[^a-zA-Z0-9-_\.]/g, '-')
    const filename = `${invoice.number}-${customerName}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Error generating Shopify order PDF:', error)
    return NextResponse.json({ success: false, error: 'Fehler beim Generieren der PDF' }, { status: 500 })
  }
}
