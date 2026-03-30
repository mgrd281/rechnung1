export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'

export async function DELETE(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return new NextResponse('Missing redirect ID', { status: 400 })
        }

        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)
        await shopify.deleteRedirect(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting redirect:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
