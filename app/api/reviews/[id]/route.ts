export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params

        await prisma.review.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting review:', error)
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const review = await prisma.review.update({
            where: { id },
            data: body
        })

        return NextResponse.json({ success: true, review })
    } catch (error) {
        console.error('Error updating review:', error)
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }
}
