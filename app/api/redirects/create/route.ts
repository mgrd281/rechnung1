export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const body = await req.json()
        const { path, target, brokenLinkId } = body

        if (!path || !target) {
            return new NextResponse('Missing path or target', { status: 400 })
        }

        // 1. Create redirect in Shopify
        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)
        const redirect = await shopify.createRedirect(path, target)

        // 2. Mark broken link as resolved if ID provided
        if (brokenLinkId) {
            await prisma.brokenLink.update({
                where: { id: brokenLinkId },
                data: { resolved: true }
            })
        }

        // 3. Log action
        await prisma.redirectActionLog.create({
            data: {
                organizationId,
                type: 'SINGLE',
                details: { path, target, shopifyId: redirect.id }
            }
        })

        return NextResponse.json({ success: true, data: redirect })
    } catch (error: any) {
        console.error('Error creating redirect:', error)
        return new NextResponse(error.message || 'Internal Error', { status: 500 })
    }
}
