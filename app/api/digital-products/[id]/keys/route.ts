export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resendDigitalProductEmail } from '@/lib/digital-products'

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params
        const keys = await prisma.licenseKey.findMany({
            where: { digitalProductId: id },
            include: {
                customer: {
                    select: { email: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ success: true, data: keys })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // HAMDLE RESEND ACTION
        if (body.action === 'resend' && body.keyId) {
            await resendDigitalProductEmail(body.keyId)
            return NextResponse.json({ success: true, message: 'Email resent' })
        }

        const { keys, shopifyVariantId } = body

        if (!Array.isArray(keys)) {
            return NextResponse.json({ error: 'Keys must be an array' }, { status: 400 })
        }

        const createdKeys = await prisma.licenseKey.createMany({
            data: keys.map((key: string) => ({
                key,
                digitalProductId: id,
                isUsed: false,
                shopifyVariantId: shopifyVariantId || null
            }))
        })

        return NextResponse.json({ success: true, count: createdKeys.count })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add keys' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params // digitalProductId (not used for deletion if we have keyIds, but good for verification)

        // Check for query param 'keyId'
        const { searchParams } = new URL(request.url)
        const keyId = searchParams.get('keyId')

        if (keyId) {
            // Single delete
            await prisma.licenseKey.delete({
                where: { id: keyId }
            })
            return NextResponse.json({ success: true })
        }

        // Bulk delete from body
        const body = await request.json().catch(() => ({}))
        const { keyIds } = body

        if (keyIds && Array.isArray(keyIds) && keyIds.length > 0) {
            await prisma.licenseKey.deleteMany({
                where: {
                    id: { in: keyIds }
                }
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'No keys specified' }, { status: 400 })

    } catch (error) {
        console.error('Error deleting keys:', error)
        return NextResponse.json({ error: 'Failed to delete keys' }, { status: 500 })
    }
}
