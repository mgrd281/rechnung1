export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Get the first organization (assuming single tenant for this context)
        const org = await prisma.organization.findFirst()

        if (!org) {
            return NextResponse.json({
                totalReviews: 0,
                averageRating: 0,
                photoReviews: 0,
                pendingReviews: 0,
                recentReviews: []
            })
        }

        // 1. Total Reviews
        const totalReviews = await prisma.review.count({
            where: {
                organizationId: org.id,
                status: { not: 'DELETED' }
            }
        })

        // 2. Average Rating
        const aggregate = await prisma.review.aggregate({
            where: {
                organizationId: org.id,
                status: { not: 'DELETED' }
            },
            _avg: { rating: true }
        })
        const averageRating = aggregate._avg.rating || 0

        // 3. Photo Reviews (reviews with images)
        // Note: Prisma's array filtering can be tricky. 
        // We'll count where images is not empty.
        const photoReviews = await prisma.review.count({
            where: {
                organizationId: org.id,
                status: { not: 'DELETED' },
                NOT: {
                    images: {
                        equals: []
                    }
                }
            }
        })

        // 4. Pending Reviews
        const pendingReviews = await prisma.review.count({
            where: {
                organizationId: org.id,
                status: 'PENDING'
            }
        })

        // 5. Recent Reviews
        const recentReviews = await prisma.review.findMany({
            where: {
                organizationId: org.id,
                status: { not: 'DELETED' }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        })

        // 6. Negative Reviews (1-2 Stars)
        const negativeReviews = await prisma.review.findMany({
            where: {
                organizationId: org.id,
                status: { not: 'DELETED' },
                rating: { lte: 2 }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // 7. Analysis Data
        // Calculate trend (last 30 days vs previous 30 days)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        const currentPeriodReviews = await prisma.review.count({
            where: {
                organizationId: org.id,
                rating: { lte: 2 },
                createdAt: { gte: thirtyDaysAgo }
            }
        })

        const previousPeriodReviews = await prisma.review.count({
            where: {
                organizationId: org.id,
                rating: { lte: 2 },
                createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
            }
        })

        const trend = currentPeriodReviews - previousPeriodReviews
        const trendDirection = trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'

        // Top negative reasons (Mocked for now as we don't have NLP)
        const negativeReasons = [
            { reason: 'Versand', count: 12, percentage: 45 },
            { reason: 'Qualität', count: 8, percentage: 30 },
            { reason: 'Support', count: 4, percentage: 15 },
            { reason: 'Sonstiges', count: 3, percentage: 10 }
        ]

        // Negative percentage
        const negativePercentage = totalReviews > 0 ? Math.round((await prisma.review.count({
            where: { organizationId: org.id, rating: { lte: 2 } }
        }) / totalReviews) * 100) : 0

        // Helper to enhance reviews with Shopify images
        const enhanceReviewsWithImages = async (reviews: any[]) => {
            const { ShopifyAPI } = await import('@/lib/shopify-api')
            const shopifyApi = new ShopifyAPI()

            return Promise.all(reviews.map(async (review) => {
                if (!review.productImage && review.productId) {
                    try {
                        const product = await shopifyApi.getProduct(review.productId)
                        if (product && product.images && product.images.length > 0) {
                            return { ...review, productImage: product.images[0].src }
                        }
                    } catch (e) {
                        // Ignore error
                    }
                }
                return review
            }))
        }

        const enhancedRecentReviews = await enhanceReviewsWithImages(recentReviews)
        const enhancedNegativeReviews = await enhanceReviewsWithImages(negativeReviews)

        return NextResponse.json({
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(1)),
            photoReviews,
            pendingReviews,
            recentReviews: enhancedRecentReviews,
            negativeReviews: enhancedNegativeReviews,
            analysis: {
                trend,
                trendDirection,
                negativeReasons,
                negativePercentage
            }
        })

    } catch (error) {
        console.error('Error fetching review stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
