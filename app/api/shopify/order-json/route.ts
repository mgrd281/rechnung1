import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    const nameParam = searchParams.get('name')

    const settings = getShopifySettings()
    if (!settings.enabled) {
      return NextResponse.json({ success: false, error: 'Shopify Integration ist nicht aktiviert' }, { status: 400 })
    }

    const api = new ShopifyAPI(settings)

    if (idParam) {
      const orderId = parseInt(idParam, 10)
      if (Number.isNaN(orderId)) {
        return NextResponse.json({ success: false, error: 'Invalid order id' }, { status: 400 })
      }
      const order = await api.getOrder(orderId)
      if (!order) {
        return NextResponse.json({ success: false, error: `Bestellung ${orderId} nicht gefunden` }, { status: 404 })
      }
      return NextResponse.json({ success: true, order })
    }

    if (nameParam) {
      // Normalize name (ensure it starts with #)
      const name = nameParam.startsWith('#') ? nameParam : `#${nameParam}`
      // Fetch orders (unlimited pagination) and find by name
      const orders = await api.getOrders({ limit: 999999 })
      const found = orders.find(o => o.name === name)
      if (!found) {
        return NextResponse.json({ success: false, error: `Bestellung mit Name ${name} nicht gefunden` }, { status: 404 })
      }
      return NextResponse.json({ success: true, order: found })
    }

    return NextResponse.json({ success: false, error: 'Bitte id oder name angeben' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching Shopify order JSON:', error)
    return NextResponse.json({ success: false, error: 'Fehler beim Abrufen der Bestelldaten' }, { status: 500 })
  }
}
