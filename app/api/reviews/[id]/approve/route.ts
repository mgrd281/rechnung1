export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params

        const review = await prisma.review.update({
            where: { id },
            data: { status: 'APPROVED' }
        })

        return NextResponse.json({ success: true, review })
    } catch (error) {
        console.error('Error approving review:', error)
        return NextResponse.json({ error: 'Failed to approve review' }, { status: 500 })
    }
}
