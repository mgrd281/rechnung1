export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const productId = params.id

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        // Soft delete all reviews for this product
        await prisma.review.updateMany({
            where: {
                productId: productId
            },
            data: {
                status: 'DELETED'
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting product reviews:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
