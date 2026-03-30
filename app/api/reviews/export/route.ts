import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productIds = searchParams.get('productIds')
        const status = searchParams.get('status')
        const rating = searchParams.get('rating')

        const where: any = {}

        // Filter by Product IDs
        if (productIds) {
            const ids = productIds.split(',').filter(id => id.trim() !== '')
            if (ids.length > 0) {
                where.productId = { in: ids }
            }
        }

        // Filter by Status
        if (status) {
            where.status = status
        }

        // Filter by Rating
        if (rating) {
            where.rating = parseInt(rating)
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                productTitle: true,
                productId: true,
                title: true,
                content: true,
                rating: true,
                customerName: true,
                customerEmail: true,
                createdAt: true,
                status: true
            }
        })

        return NextResponse.json({ reviews })

    } catch (error) {
        console.error('Error exporting reviews:', error)
        return NextResponse.json({ error: 'Failed to export reviews' }, { status: 500 })
    }
}
