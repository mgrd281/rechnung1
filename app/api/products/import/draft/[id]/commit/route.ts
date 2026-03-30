export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { transformToShopifyProduct } from '@/lib/shopify-transform'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const draft = await prisma.importDraft.findUnique({
            where: { id: params.id }
        })

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        if (draft.status === 'IMPORTED') {
            return NextResponse.json({ error: 'Draft already imported' }, { status: 400 })
        }

        // Initialize Shopify API
        const shopifySettings = getShopifySettings()
        if (!shopifySettings.accessToken || !shopifySettings.shopDomain) {
            return NextResponse.json({ error: 'Shopify settings are not configured' }, { status: 500 })
        }
        const api = new ShopifyAPI(shopifySettings)

        // Transform Data
        const productData = draft.data as any
        const settings = draft.settings as any

        const shopifyProduct = transformToShopifyProduct(productData, {
            ...settings,
            isActive: settings.isActive,
            isPhysical: settings.isPhysical,
            chargeTax: settings.chargeTax,
            trackQuantity: settings.trackQuantity
        })

        // Create in Shopify
        const createdProduct = await api.createProduct(shopifyProduct)

        // Publish to Channels
        if (createdProduct && createdProduct.id) {
            await api.publishProductToAllChannels(createdProduct.id)
        }

        // Collection
        if (settings.collection && createdProduct.id) {
            const collectionId = parseInt(settings.collection)
            if (!isNaN(collectionId)) {
                await api.addProductToCollection(createdProduct.id, collectionId)
            }
        }

        // Mark Draft as IMPORTED
        await prisma.importDraft.update({
            where: { id: params.id },
            data: { status: 'IMPORTED' }
        })

        return NextResponse.json({ success: true, product: createdProduct })

    } catch (error) {
        console.error('Error committing draft to Shopify:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to commit draft'
        }, { status: 500 })
    }
}
