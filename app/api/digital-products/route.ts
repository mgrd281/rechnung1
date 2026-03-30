import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        let user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        // AUTO-LINK: If user has no organization but one exists, link them (helpful for recovery)
        if (user && !user.organizationId) {
            const firstOrg = await prisma.organization.findFirst()
            if (firstOrg) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { organizationId: firstOrg.id },
                    include: { organization: true }
                })
            }
        }

        if (!user?.organizationId) {
            return NextResponse.json({ success: true, data: [] })
        }

        const products = await prisma.digitalProduct.findMany({
            where: {
                organizationId: user.organizationId
            },
            orderBy: { createdAt: 'desc' },
            include: {
                keys: {
                    where: { isUsed: false },
                    select: { id: true }
                }
            }
        })

        // Fetch images from Shopify for each product
        const shopifyApi = new ShopifyAPI()
        const formattedProducts = await Promise.all(products.map(async (p) => {
            let image = null
            try {
                const shopifyProduct = await shopifyApi.getProduct(p.shopifyProductId)
                if (shopifyProduct && shopifyProduct.images && shopifyProduct.images.length > 0) {
                    image = shopifyProduct.images[0].src
                }
            } catch (e) {
                console.error(`Failed to fetch Shopify product ${p.shopifyProductId}`, e)
            }

            return {
                ...p,
                image,
                _count: {
                    keys: p.keys.length
                },
                keys: undefined
            }
        }))

        return NextResponse.json({ success: true, data: formattedProducts })

    } catch (error) {
        console.error('Error fetching digital products:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()

        // 1. Get current user with organization
        let currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        // AUTO-LINK: If user has no organization but one exists, link them (helpful for recovery)
        if (currentUser && !currentUser.organizationId) {
            const firstOrg = await prisma.organization.findFirst()
            if (firstOrg) {
                currentUser = await prisma.user.update({
                    where: { id: currentUser.id },
                    data: { organizationId: firstOrg.id },
                    include: { organization: true }
                })
            }
        }

        if (!currentUser?.organization) {
            return NextResponse.json(
                { error: 'User has no organization linked.' },
                { status: 400 }
            )
        }

        const orgId = currentUser.organization.id

        const product = await prisma.digitalProduct.upsert({
            where: {
                shopifyProductId: body.shopifyProductId
            },
            update: {
                title: body.title,
                // CRITICAL: Move product to current user's organization if it belongs to another one
                organization: {
                    connect: { id: orgId }
                }
            },
            create: {
                title: body.title,
                shopifyProductId: body.shopifyProductId,
                organization: {
                    connect: { id: orgId }
                }
            }
        })

        // Return consistent format with GET
        return NextResponse.json({
            success: true,
            data: {
                ...product,
                _count: { keys: 0 }, // New/Just activated products have 0 keys
                image: null // Frontend uses Shopify image anyway
            }
        })

    } catch (error: any) {
        console.error('Error creating digital product:', error)
        // Return JSON error with message to help debugging
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
