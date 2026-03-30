export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getShopifySettings } from '@/lib/shopify-settings'
import { ShopifyAPI } from '@/lib/shopify-api'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name')

        if (!name) {
            return NextResponse.json({ error: 'Name parameter required' }, { status: 400 })
        }

        const settings = getShopifySettings()
        const api = new ShopifyAPI(settings)

        // Search for order by name
        console.log(`🔍 Debug: Searching for order with name: ${name}`)
        // Note: Shopify API expects 'name' to be the full name like "#3504" or just "3504" might work depending on exact match
        // We'll try fetching list with name filter
        const response = await fetch(`https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders.json?name=${name}&status=any`, {
            headers: {
                'X-Shopify-Access-Token': settings.accessToken,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            return NextResponse.json({ error: `Shopify API error: ${response.status} ${response.statusText}` }, { status: response.status })
        }

        const data = await response.json()
        const orders = data.orders || []

        if (orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Return the first matching order (full raw JSON)
        return NextResponse.json({
            count: orders.length,
            firstOrder: orders[0]
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
