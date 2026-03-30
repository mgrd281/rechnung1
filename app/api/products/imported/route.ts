import { NextRequest, NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const shopifySettings = getShopifySettings()
        if (!shopifySettings.accessToken || !shopifySettings.shopDomain) {
            return NextResponse.json({ error: 'Shopify settings are not configured' }, { status: 500 })
        }

        const api = new ShopifyAPI(shopifySettings)

        // Fetch products with tag "Imported" directly from Shopify
        // This is much more efficient and avoids the 250 limit issue for non-imported products
        const products = await api.getProducts({
            limit: 250,
            tags: 'Imported',
            fetchOptions: { cache: 'no-store' }
        })

        // Sort by created_at descending (newest first)
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return NextResponse.json({
            success: true,
            products,
            shopDomain: shopifySettings.shopDomain
        })

    } catch (error) {
        console.error('Error fetching imported products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}
