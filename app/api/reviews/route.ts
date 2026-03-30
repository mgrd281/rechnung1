import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status')
        const productId = searchParams.get('productId')
        const search = searchParams.get('search')

        const skip = (page - 1) * limit

        const where: any = {}
        if (status) where.status = status
        if (productId) where.productId = productId
        if (search) {
            where.OR = [
                { content: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } }
            ]
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.review.count({ where })
        ])

        // Enhance reviews with Shopify images if missing
        const shopifyApi = new ShopifyAPI()
        const enhancedReviews = await Promise.all(reviews.map(async (review) => {
            if (!review.productImage && review.productId) {
                try {
                    const shopifyProduct = await shopifyApi.getProduct(review.productId)
                    if (shopifyProduct && shopifyProduct.images && shopifyProduct.images.length > 0) {
                        return { ...review, productImage: shopifyProduct.images[0].src }
                    }
                } catch (e) {
                    // Ignore error
                }
            }
            return review
        }))

        return NextResponse.json({
            reviews: enhancedReviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Error fetching reviews:', error)
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { ids, productId } = body

        if (productId) {
            // Delete all reviews for this product
            await prisma.review.deleteMany({
                where: {
                    productId: String(productId)
                }
            })
            return NextResponse.json({ success: true })
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        await prisma.review.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting reviews:', error)
        return NextResponse.json({ error: 'Failed to delete reviews' }, { status: 500 })
    }
}
