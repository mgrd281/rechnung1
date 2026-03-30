export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'

export async function GET(req: Request) {
    try {
        const api = new ShopifyAPI()
        const collections = await api.getCollections()

        return NextResponse.json({ success: true, collections })
    } catch (error) {
        console.error('Error fetching Shopify collections:', error)
        return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }
}
