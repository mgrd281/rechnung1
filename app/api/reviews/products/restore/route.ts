export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { productIds } = await request.json()

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Invalid productIds' }, { status: 400 })
        }

        // Restore reviews (Set back to PUBLISHED or PENDING?)
        // To be safe, let's set to PUBLISHED if they were previously visible, but we lost that state.
        // Actually, if we restore, let's set to 'PUBLISHED' for now as a safe default for "undoing a delete".
        // Or maybe 'PENDING' for safety? The user can approve them again.
        // But "Undo" implies returning to previous visual state.
        // If most were published, 'PUBLISHED' is better.
        // Let's go with 'PUBLISHED' but ideally we should have stored previous status.
        // For this task scope, 'PUBLISHED' is acceptable for "Restoring".

        await prisma.review.updateMany({
            where: {
                productId: {
                    in: productIds
                },
                status: 'DELETED'
            },
            data: {
                status: 'PUBLISHED'
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error restoring products:', error)
        return NextResponse.json({ error: 'Failed to restore products' }, { status: 500 })
    }
}
