export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params
        const body = await request.json().catch(() => ({})) // Handle empty body safely
        const action = body.action || 'helpful' // Default to helpful for backward compatibility

        if (!id) {
            return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
        }

        let updateData = {}
        if (action === 'notHelpful') {
            updateData = { notHelpful: { increment: 1 } }
        } else {
            updateData = { helpful: { increment: 1 } }
        }

        const review = await prisma.review.update({
            where: { id },
            data: updateData,
            select: {
                helpful: true,
                notHelpful: true
            }
        })

        return NextResponse.json({
            success: true,
            helpful: review.helpful,
            notHelpful: review.notHelpful
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            }
        })

    } catch (error) {
        console.error('Error updating vote count:', error)
        return NextResponse.json({ error: 'Failed to update vote count' }, { status: 500 })
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
