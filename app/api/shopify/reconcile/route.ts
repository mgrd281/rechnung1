
import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { prisma } from '@/lib/prisma'
import { syncShopifyOrder } from '@/lib/shopify-sync'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { shop, days = 60 } = await req.json()
        
        if (!shop) {
            return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 })
        }

        const settings = getShopifySettings()
        const api = new ShopifyAPI(settings)

        // Find organization
        const connection = await prisma.shopifyConnection.findFirst({
            where: { shopName: shop },
            include: { organization: true }
        })
        
        const orgId = connection?.organizationId
        if (!orgId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        console.log(`[Reconcile] Starting reconciliation for ${shop}, last ${days} days...`)

        // 1. Fetch historical orders
        const dateMin = new Date()
        dateMin.setDate(dateMin.getDate() - days)
        
        const orders = await api.getOrders({
            created_at_min: dateMin.toISOString(),
            status: 'any',
            financial_status: 'any'
        })

        console.log(`[Reconcile] Found ${orders.length} orders to verify.`)

        let updatedCount = 0
        let errorCount = 0

        // 2. Process each order
        for (const order of orders) {
            try {
                const result = await syncShopifyOrder(order.id, orgId)
                if (result) updatedCount++
            } catch (err) {
                console.error(`[Reconcile] Error syncing order ${order.id}:`, err)
                errorCount++
            }
            
            // Artificial delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100))
        }

        return NextResponse.json({
            success: true,
            totalChecked: orders.length,
            updated: updatedCount,
            errors: errorCount,
            message: `Abgleich abgeschlossen. ${updatedCount} Bestellungen synchronisiert.`
        })

    } catch (error: any) {
        console.error('[Reconcile] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
