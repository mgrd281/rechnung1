import { NextResponse, NextRequest } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        // Default to ALL (unlimited) if no limit specified, or use the param
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam) : 999999

        const api = new ShopifyAPI()

        // Fetch essential fields used by frontend (including vendor/type for filtering and image for display)
        const products = await api.getProducts({
            limit,
            fields: 'id,title,handle,variants,images,image,vendor,product_type'
        })

        return NextResponse.json({
            success: true,
            data: products,
            count: products.length
        })
    } catch (error) {
        console.error('Error fetching Shopify products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}
