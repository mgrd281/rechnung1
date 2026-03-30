export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    const { id } = await params
    try {
        const productId = id // Assuming 'id' from params is the product ID
        if (!productId) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        console.log(`Attempting to retrieve product ${productId}`)

        const shopifySettings = getShopifySettings()
        if (!shopifySettings.accessToken || !shopifySettings.shopDomain) {
            return NextResponse.json({ error: 'Shopify settings are not configured' }, { status: 500 })
        }

        const api = new ShopifyAPI(shopifySettings)

        // 1. Fetch from Shopify
        const shopifyProduct = await api.getProduct(productId)
        if (!shopifyProduct) {
            return NextResponse.json({ error: 'Product not found in Shopify' }, { status: 404 })
        }
        console.log(`Shopify product ${productId} retrieved successfully`)

        // 2. Fetch related local data (e.g., DigitalProduct)
        const digitalProduct = await prisma.digitalProduct.findUnique({
            where: {
                shopifyProductId: id // Use string ID directly
            }
        })

        return NextResponse.json({
            success: true,
            product: shopifyProduct,
            digitalProduct: digitalProduct
        })

    } catch (error) {
        console.error('Error in GET route:', error)
        return NextResponse.json({ error: 'Failed to retrieve product' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: any }
) {
    const { id } = await params
    try {
        const productId = parseInt(id)
        if (isNaN(productId)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        console.log(`Attempting to delete product ${productId}`)

        const shopifySettings = getShopifySettings()
        if (!shopifySettings.accessToken || !shopifySettings.shopDomain) {
            return NextResponse.json({ error: 'Shopify settings are not configured' }, { status: 500 })
        }

        const api = new ShopifyAPI(shopifySettings)

        // 1. Delete from Shopify (Ignore 404 if already deleted)
        try {
            await api.deleteProduct(productId)
            console.log(`Shopify product ${productId} deleted successfully`)
        } catch (error: any) {
            const errorMessage = error.message || ''
            if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                console.log(`Product ${productId} already deleted from Shopify (404), proceeding to local cleanup.`)
            } else {
                console.warn(`Warning: Failed to delete product ${productId} from Shopify:`, error)
            }
        }

        // 2. Delete from local database (Review & DigitalProduct) if exists
        try {
            // Delete Reviews
            const deletedReviews = await prisma.review.deleteMany({
                where: {
                    productId: productId.toString()
                }
            })
            console.log(`Deleted ${deletedReviews.count} local reviews for product ${productId}`)

            // Delete DigitalProduct (if exists)
            // We need to check if there's a DigitalProduct with this shopifyProductId
            // Note: shopifyProductId in DigitalProduct is String @unique
            try {
                const deletedDigitalProduct = await prisma.digitalProduct.deleteMany({
                    where: {
                        shopifyProductId: productId.toString()
                    }
                })
                console.log(`Deleted ${deletedDigitalProduct.count} digital products for product ${productId}`)
            } catch (dpError) {
                console.log('No digital product found or error deleting:', dpError)
            }

        } catch (dbError) {
            console.error('Error deleting local data:', dbError)
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error in delete route:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: any }
) {
    const { id } = await params
    try {
        const productId = parseInt(id)
        if (isNaN(productId)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        const body = await request.json()
        const { product } = body

        if (!product) {
            return NextResponse.json({ error: 'Product data is required' }, { status: 400 })
        }

        const shopifySettings = getShopifySettings()
        if (!shopifySettings.accessToken || !shopifySettings.shopDomain) {
            return NextResponse.json({ error: 'Shopify settings are not configured' }, { status: 500 })
        }

        const api = new ShopifyAPI(shopifySettings)
        const updatedProduct = await api.updateProduct(productId, product)

        return NextResponse.json({ success: true, product: updatedProduct })

    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}
