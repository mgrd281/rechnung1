
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { syncShopifyOrder } from '@/lib/shopify-sync'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // @ts-ignore
        let organizationId = session.user.organizationId
        if (!organizationId) {
            const firstOrg = await prisma.organization.findFirst()
            organizationId = firstOrg?.id
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 })
        }

        const body = await request.json()
        const days = body.days || 90

        console.log(`🚀 Starting Customer Backfill for organization ${organizationId}, last ${days} days`)

        const api = new ShopifyAPI()

        // Calculate date limit
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - days)
        const createdAtMin = dateLimit.toISOString()

        // Fetch orders from Shopify
        const orders = await api.getOrders({
            created_at_min: createdAtMin,
            status: 'any'
        })

        console.log(`📦 Found ${orders.length} orders in Shopify to process`)

        let updatedCount = 0
        let errorCount = 0
        const errors: string[] = []

        // Process in batches to avoid overwhelming the system
        for (const order of orders) {
            try {
                const result = await syncShopifyOrder(order.id, organizationId)
                if (result) {
                    updatedCount++
                }
            } catch (err: any) {
                console.error(`❌ Failed to sync order ${order.name}:`, err.message)
                errorCount++
                errors.push(`${order.name}: ${err.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            totalProcessed: orders.length,
            updatedCount,
            errorCount,
            errors: errors.slice(0, 10), // Return first 10 errors
            message: `Backfill abgeschlossen. ${updatedCount} Bestellungen synchronisiert, ${errorCount} Fehler.`
        })

    } catch (error: any) {
        console.error('Backfill Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
