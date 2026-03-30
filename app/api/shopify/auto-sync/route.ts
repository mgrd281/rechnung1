import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { handleOrderCreate } from '@/lib/shopify-order-handler'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = getShopifySettings()
        if (!settings.shopDomain || !settings.accessToken) {
            return NextResponse.json({ synced: 0, message: 'Shopify not configured: Missing domain or token' })
        }

        const api = new ShopifyAPI(settings)

        // Test connection first
        try {
            await api.testConnection()
        } catch (connErr: any) {
            return NextResponse.json({
                synced: 0,
                error: `Connection Failed: ${connErr.message}`,
                details: 'Please check SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN'
            }, { status: 500 })
        }

        // 1. Get existing order IDs and their statuses from our DB
        const existingOrders = await prisma.order.findMany({
            where: { shopifyOrderId: { not: null } },
            select: { shopifyOrderId: true, status: true, invoices: { select: { status: true }, take: 1 } }
        })

        const invoiceStatusMap = new Map<string, string>()
        existingOrders.forEach(o => {
            if (o.shopifyOrderId) {
                const invStatus = o.invoices[0]?.status || 'PENDING'
                invoiceStatusMap.set(o.shopifyOrderId, invStatus)
            }
        })

        // 2. Fetch strategy
        let fetchParams: any = { limit: 50, status: 'any' }

        // If very few orders, do historical sync
        if (invoiceStatusMap.size < 5) {
            console.log('🕳️ Low invoice count. Triggering HISTORICAL SYNC...')
            fetchParams = {
                limit: 250,
                status: 'any',
                created_at_min: '2025-01-01T00:00:00',
                maxPages: 4 // Limit to 1000 orders max per run to prevent timeout
            }
        }

        let recentOrders: any[] = []
        try {
            recentOrders = await api.getOrders(fetchParams)
        } catch (fetchErr: any) {
            return NextResponse.json({
                synced: 0,
                error: `Fetch Orders Failed: ${fetchErr.message}`,
                range: fetchParams.created_at_min
            }, { status: 500 })
        }

        let syncedCount = 0
        let updatedCount = 0
        let errorCount = 0
        const processedIds: string[] = []
        let lastError = ''

        for (const order of recentOrders) {
            try {
                const orderIdStr = order.id.toString()
                const internalStatus = invoiceStatusMap.get(orderIdStr)

                if (!internalStatus || internalStatus !== 'PAID') {
                    console.log(`🔄 Auto-Sync: Processing order #${order.name} (ID: ${orderIdStr})`)

                    const invoice = await handleOrderCreate(order, settings.shopDomain, true)

                    if (invoice && invoice.id) {
                        if (!internalStatus) syncedCount++
                        else updatedCount++
                        processedIds.push(invoice.id)
                    }
                }
            } catch (orderError: any) {
                console.error(`❌ Auto-Sync: Error processing order ${order.name}:`, orderError)
                errorCount++
                lastError = orderError.message
            }
        }

        return NextResponse.json({
            synced: syncedCount,
            updated: updatedCount,
            errors: errorCount,
            lastError: lastError,
            totalFoundInShopify: recentOrders.length,
            message: `Synced ${syncedCount} new, ${updatedCount} updated. Found ${recentOrders.length} orders. ${errorCount > 0 ? `Errors: ${errorCount} (${lastError})` : ''}`
        })

    } catch (error: any) {
        console.error('❌ Global Auto-Sync Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
