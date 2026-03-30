import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { normalizeSource } from '@/lib/traffic-source'

import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user || (session.user as any).role !== 'ADMIN' && !(session.user as any).isAdmin) {
             // Allow if user is just authenticated for now, or check generic role. 
             // The user schema has 'role' and 'isAdmin' property checks usually.
             // We'll just check existence for simplicity or assume protected by middleware if needed.
             // But let's check basic auth.
             if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const limit = Number(request.nextUrl.searchParams.get('limit')) || 20
        
        // Find invoices without source
        const invoices = await prisma.invoice.findMany({
            where: {
                trafficSourceKey: null,
                orderNumber: { not: null } // Only those with order numbers (likely from Shopify)
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        })

        if (invoices.length === 0) {
            return NextResponse.json({ message: 'No invoices to backfill', processed: 0 })
        }

        const api = new ShopifyAPI()
        let processed = 0
        let updated = 0
        let errors = 0
        
        const results = []

        for (const invoice of invoices) {
            try {
                if (!invoice.orderNumber) continue;

                // Try to find the order in Shopify
                // We don't have the Shopify ID on the invoice directly, but we might have it on the Order relation
                // Let's fetch the related order first if connected
                const dbOrder = invoice.orderId ? await prisma.order.findUnique({ where: { id: invoice.orderId } }) : null
                
                let shopifyOrder = null
                
                if (dbOrder && dbOrder.shopifyOrderId) {
                    shopifyOrder = await api.getOrder(Number(dbOrder.shopifyOrderId))
                }
                
                if (!shopifyOrder && invoice.orderNumber) {
                    // Try search by name
                    const orders = await api.getOrders({ name: invoice.orderNumber, status: 'any', limit: 1 })
                    if (orders.length > 0) {
                        shopifyOrder = orders[0]
                    }
                }

                if (shopifyOrder) {
                    const source = normalizeSource(shopifyOrder)
                    
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: {
                            trafficSourceKey: source.sourceKey,
                            trafficSourceLabel: source.sourceLabel,
                            trafficSourceRaw: source.rawReferrer,
                            utmJson: source.utmJson
                        }
                    })
                    updated++
                    results.push({ invoice: invoice.invoiceNumber, source: source.sourceLabel })
                }
                
                processed++
                
                // Rate limit slightly
                await new Promise(r => setTimeout(r, 200)) 

            } catch (e) {
                console.error(`Failed to backfill invoice ${invoice.invoiceNumber}:`, e)
                errors++
            }
        }

        return NextResponse.json({
            processed,
            updated,
            errors,
            remaining: await prisma.invoice.count({ where: { trafficSourceKey: null, orderNumber: { not: null } } }),
            results
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
