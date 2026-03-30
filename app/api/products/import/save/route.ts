export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { transformToShopifyProduct } from '@/lib/shopify-transform'

export async function POST(request: NextRequest) {
    try {
        const { product, settings } = await request.json()

        if (!product) {
            return NextResponse.json({ error: 'Product data is required' }, { status: 400 })
        }

        // Initialize Shopify API
        const shopifySettings = getShopifySettings()
        if (!shopifySettings.accessToken || !shopifySettings.shopDomain) {
            return NextResponse.json({ error: 'Shopify settings are not configured' }, { status: 500 })
        }
        const api = new ShopifyAPI(shopifySettings)

        // Use the central transformation logic to get consistent payload
        const shopifyProduct = transformToShopifyProduct(product, {
            ...settings,
            isActive: settings.isActive,
            isPhysical: settings.isPhysical,
            chargeTax: settings.chargeTax,
            trackQuantity: settings.trackQuantity
        })

        console.log('Final Shopify Product Payload (via Transform):', JSON.stringify(shopifyProduct, null, 2))

        // Create the product in Shopify
        const createdProduct = await api.createProduct(shopifyProduct)

        // Publish to ALL Sales Channels (Google, TikTok, etc.)
        if (createdProduct && createdProduct.id) {
            await api.publishProductToAllChannels(createdProduct.id)
        }

        // Add to collection if specified
        if (settings.collection && createdProduct.id) {
            const collectionId = parseInt(settings.collection)
            if (!isNaN(collectionId)) {
                await api.addProductToCollection(createdProduct.id, collectionId)
            } else {
                console.warn('Collection ID is not a number, skipping add to collection:', settings.collection)
            }
        }

        return NextResponse.json({ success: true, product: createdProduct })

    } catch (error) {
        console.error('Error saving product to Shopify:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to save product'
        }, { status: 500 })
    }
}
