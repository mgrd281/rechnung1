export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
        const { redirects } = body // Expected: [{ path, target, brokenLinkId }]

        if (!redirects || !Array.isArray(redirects)) {
            return new NextResponse('Invalid data', { status: 400 })
        }

        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)

        let successCount = 0
        const errors = []

        for (const red of redirects) {
            try {
                await shopify.createRedirect(red.path, red.target)
                successCount++

                if (red.brokenLinkId) {
                    await prisma.brokenLink.update({
                        where: { id: red.brokenLinkId },
                        data: { resolved: true }
                    })
                }
            } catch (err: any) {
                errors.push({ path: red.path, error: err.message })
            }
        }

        return NextResponse.json({ success: true, successCount, errors })
    } catch (error) {
        console.error('Error bulk creating redirects:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
