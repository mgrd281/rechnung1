export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'

export async function GET(request: NextRequest) {
    try {
        const organization = await prisma.organization.findFirst()
        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Group reviews by productId only to avoid splitting stats for the same product
        const groupedReviews = await prisma.review.groupBy({
            by: ['productId'],
            where: {
                organizationId: organization.id,
                status: {
                    not: 'DELETED'
                }
            },
            _count: {
                id: true
            },
            _avg: {
                rating: true
            },
            _max: {
                createdAt: true,
                productTitle: true,
                productImage: true
            },
            orderBy: {
                _max: {
                    createdAt: 'desc'
                }
            }
        })

        // Format the response
        // Format the response
        const shopifyApi = new ShopifyAPI()

        const productStats = await Promise.all(groupedReviews.map(async (group) => {
            let image = group._max.productImage

            // If no image in DB, try to fetch from Shopify
            if (!image) {
                try {
                    const shopifyProduct = await shopifyApi.getProduct(group.productId)
                    if (shopifyProduct && shopifyProduct.images && shopifyProduct.images.length > 0) {
                        image = shopifyProduct.images[0].src
                    }
                } catch (e) {
                    console.error(`Failed to fetch Shopify product ${group.productId}`, e)
                }
            }

            return {
                productId: group.productId,
                productTitle: group._max.productTitle || 'Unbekanntes Produkt',
                productImage: image,
                reviewCount: group._count.id,
                averageRating: group._avg.rating || 0,
                lastReviewDate: group._max.createdAt
            }
        }))

        return NextResponse.json(productStats)
    } catch (error) {
        console.error('Error fetching product review stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
