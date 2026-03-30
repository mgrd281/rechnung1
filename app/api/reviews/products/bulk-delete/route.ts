export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { productIds } = await request.json()

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Invalid productIds' }, { status: 400 })
        }

        // Soft delete all reviews for these products
        await prisma.review.updateMany({
            where: {
                productId: {
                    in: productIds
                }
            },
            data: {
                status: 'DELETED'
            }
        })

        return NextResponse.json({ success: true, count: productIds.length })
    } catch (error) {
        console.error('Error bulk deleting products:', error)
        return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 })
    }
}
