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
        const { rows } = body // Expected: [{ from_path, to_url, type, note }]

        if (!rows || !Array.isArray(rows)) {
            return new NextResponse('Invalid data format', { status: 400 })
        }

        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)

        let successCount = 0
        let errorCount = 0
        const logs = []

        for (const row of rows) {
            try {
                if (row.from_path && row.to_url) {
                    await shopify.createRedirect(row.from_path, row.to_url)
                    successCount++
                } else {
                    errorCount++
                }
            } catch (err: any) {
                errorCount++
                logs.push({ row, error: err.message })
            }
        }

        // Log bulk action
        await prisma.redirectActionLog.create({
            data: {
                organizationId,
                type: 'CSV',
                details: { successCount, errorCount, errors: logs }
            }
        })

        return NextResponse.json({ success: true, successCount, errorCount, errors: logs })
    } catch (error) {
        console.error('Error importing CSV redirects:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
