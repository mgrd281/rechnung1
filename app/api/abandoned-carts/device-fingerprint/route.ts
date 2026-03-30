export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

export async function POST(req: Request) {
    try {
        const data = await req.json()
        const { checkoutId, checkoutToken, shopDomain, deviceInfo } = data

        if ((!checkoutId && !checkoutToken) || !shopDomain || !deviceInfo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find the organization
        let connection = await prisma.shopifyConnection.findFirst({
            where: {
                OR: [
                    { shopName: shopDomain },
                    { shopName: shopDomain.replace('.myshopify.com', '') }
                ]
            }
        })

        if (!connection) {
            console.error(`[DeviceFingerprint] No connection for shop: ${shopDomain}`)
            return NextResponse.json({ error: 'Shop connection not found' }, { status: 404 })
        }

        const id = checkoutId?.toString()
        const token = checkoutToken?.toString()

        // Try to find an existing cart by ID or Token
        const existingCart = await prisma.abandonedCart.findFirst({
            where: {
                organizationId: connection.organizationId,
                OR: [
                    id ? { checkoutId: id } : {},
                    token ? { checkoutToken: token } : {}
                ].filter(o => Object.keys(o).length > 0)
            }
        })

        if (existingCart) {
            await prisma.abandonedCart.update({
                where: { id: existingCart.id },
                data: {
                    deviceInfo: {
                        ...((deviceInfo as any) || {}),
                        detection_confidence: 'high'
                    },
                    checkoutToken: token || existingCart.checkoutToken,
                    updatedAt: new Date()
                }
            })
        } else {
            // Only create if we have at least a checkout ID
            await prisma.abandonedCart.create({
                data: {
                    organizationId: connection.organizationId,
                    checkoutId: id || `tmp-${token}`,
                    checkoutToken: token,
                    email: 'tracking-pending@hidden.com',
                    cartUrl: '#',
                    deviceInfo: {
                        ...((deviceInfo as any) || {}),
                        detection_confidence: 'high'
                    },
                    isRecovered: false,
                    recoverySent: false
                }
            })
        }

        console.log(`[DeviceFingerprint] High confidence detection for ${id || token} on ${shopDomain}`)


        return NextResponse.json({ success: true }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        })
    } catch (error) {
        console.error('[DeviceFingerprint] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        })
    }
}

