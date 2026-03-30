export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShopifySettings } from '@/lib/shopify-settings'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { reviews, productId } = body

        if (!reviews || !Array.isArray(reviews)) {
            return NextResponse.json({ error: 'Reviews array is required' }, { status: 400 })
        }

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // Get Organization ID (Assuming single org for now or derived from settings/user)
        // For this standalone app, we might need to fetch the first organization or use a fixed one.
        // Let's try to find the organization associated with the Shopify settings or just the first one.
        const org = await prisma.organization.findFirst()
        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 500 })
        }

        const createdReviews = []

        for (const review of reviews) {
            // Create or find customer
            let customerId = null
            if (review.customer_email) {
                // Find existing customer by email within the organization
                let customer = await prisma.customer.findFirst({
                    where: {
                        organizationId: org.id,
                        email: review.customer_email
                    }
                })

                if (!customer) {
                    customer = await prisma.customer.create({
                        data: {
                            organizationId: org.id,
                            name: review.customer_name || 'Anonymous',
                            email: review.customer_email,
                            address: 'Imported',
                            zipCode: '00000',
                            city: 'Imported'
                        }
                    })
                }
                customerId = customer.id
            }

            const newReview = await prisma.review.create({
                data: {
                    organizationId: org.id,
                    productId: productId.toString(),
                    productTitle: review.product_title, // Optional
                    customerId: customerId,
                    customerName: review.customer_name || 'Anonymous',
                    customerEmail: review.customer_email || '',
                    rating: parseInt(review.rating) || 5,
                    title: review.title,
                    content: review.content,
                    status: 'APPROVED', // Auto-approve imported reviews
                    source: review.source || 'import',
                    isVerified: true,
                    images: review.images || [],
                    videos: review.videos || [],
                    createdAt: (review.date && !isNaN(new Date(review.date).getTime())) ? new Date(review.date) : new Date()
                }
            })
            createdReviews.push(newReview)
        }

        return NextResponse.json({ success: true, count: createdReviews.length })

    } catch (error) {
        console.error('Error creating reviews:', error)
        return NextResponse.json({ error: 'Failed to create reviews' }, { status: 500 })
    }
}
