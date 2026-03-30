export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const settings = await getShopifySettings(organizationId)
        const shopify = new ShopifyAPI(settings)
        const shopDomain = settings.shopDomain

        // 1. Create a Scan Job Record
        const job = await prisma.redirectScanJob.create({
            data: {
                organizationId,
                status: 'RUNNING',
            }
        })

            // 2. Perform background scan (simplified for now: check top 50 products/collections)
            // In a full implementation, this could use a real background worker
            (async () => {
                try {
                    const paths = await shopify.getAllStorefrontPaths()
                    const allPaths = [...paths.products, ...paths.collections, ...paths.pages].slice(0, 50)

                    let found404s = 0
                    let processed = 0

                    for (const path of allPaths) {
                        try {
                            const url = `https://${shopDomain}${path}`
                            const response = await fetch(url)

                            if (response.status === 404) {
                                found404s++
                                await prisma.brokenLink.upsert({
                                    where: { organizationId_url: { organizationId, url: path } },
                                    update: { hits: { increment: 1 }, lastSeen: new Date() },
                                    create: { organizationId, url: path, hits: 1 }
                                })
                            }
                        } catch (e) { }
                        processed++
                    }

                    await prisma.redirectScanJob.update({
                        where: { id: job.id },
                        data: {
                            status: 'COMPLETED',
                            totalUrls: allPaths.length,
                            processedUrls: processed,
                            found404s,
                            finishedAt: new Date()
                        }
                    })
                } catch (err: any) {
                    console.error('Scan job background error:', err)
                    await prisma.redirectScanJob.update({
                        where: { id: job.id },
                        data: { status: 'FAILED', errorMessage: err.message }
                    })
                }
            })()

        return NextResponse.json({ success: true, jobId: job.id })
    } catch (error) {
        console.error('Error starting scan:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
