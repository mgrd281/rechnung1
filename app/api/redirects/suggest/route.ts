export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import Fuse from 'fuse.js'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const body = await req.json()
        const { path } = body

        if (!path) {
            return new NextResponse('Missing path', { status: 400 })
        }

        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)

        // 1. Get all valid storefront paths
        const paths = await shopify.getAllStorefrontPaths()
        const allPaths = [
            ...paths.products.map(p => ({ url: p, type: 'Product' })),
            ...paths.collections.map(c => ({ url: c, type: 'Collection' })),
            ...paths.pages.map(p => ({ url: p, type: 'Page' })),
            { url: '/', type: 'Homepage' }
        ]

        // 2. Fuzzy match
        const fuse = new Fuse(allPaths, {
            keys: ['url'],
            threshold: 0.4,
            includeScore: true
        })

        const results = fuse.search(path)

        if (results.length > 0) {
            return NextResponse.json({
                success: true,
                suggestion: results[0].item.url,
                confidence: 1 - (results[0].score || 0),
                type: results[0].item.type
            })
        }

        return NextResponse.json({ success: false, message: 'No clear match found' })
    } catch (error) {
        console.error('Error suggesting redirect:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
