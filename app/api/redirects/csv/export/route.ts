export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)
        const redirects = await shopify.getRedirects()

        // Convert to CSV
        const header = "id,path,target,created_at\n"
        const rows = redirects.map((r: any) =>
            `"${r.id}","${r.path}","${r.target}","${r.created_at}"`
        ).join("\n")

        const csv = header + rows

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="shopify-redirects-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })
    } catch (error) {
        console.error('Error exporting CSV:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
