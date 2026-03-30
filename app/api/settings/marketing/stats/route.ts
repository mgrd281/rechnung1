import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const authResult = requireAuth(req as any)
        if ('error' in authResult) return authResult.error

        // @ts-ignore
        const organizationId = authResult.user.organizationId
        const whereClause = organizationId ? { organizationId } : {}

        const now = new Date()
        const thirtyDaysAgo = subDays(now, 30)

        // 1. New Customers (Last 30 Days)
        const newCustomers = await prisma.customer.count({
            where: {
                ...whereClause,
                createdAt: { gte: thirtyDaysAgo }
            }
        })

        // 2. Revenue through Automation
        // Primary source: Recovered Abandoned Carts
        const recoveredCarts = await prisma.abandonedCart.findMany({
            where: {
                ...whereClause,
                isRecovered: true,
                updatedAt: { gte: thirtyDaysAgo } // Recently recovered
            },
            select: { totalPrice: true }
        })
        const recoveredRevenue = recoveredCarts.reduce((acc, cart) => acc + Number(cart.totalPrice || 0), 0)

        // 3. Active Automations
        const marketingSettings = await prisma.marketingSettings.findUnique({
            where: { organizationId }
        })
        const abandonedCartSettings = await prisma.abandonedCartSettings.findUnique({
            where: { organizationId }
        })

        let activeCount = 0
        if (marketingSettings?.fpdEnabled) activeCount++
        if (abandonedCartSettings?.enabled) activeCount++

        // 4. Conversion Rate (Orders / Visitors)
        // Need Visitor count. Assuming PageAnalytics or Visitor table.
        // For now, using Orders / (Orders + Carts) as a proxy for "Checkout Conversion"
        const totalOrders = await prisma.order.count({
            where: {
                ...whereClause,
                createdAt: { gte: thirtyDaysAgo }
            }
        })
        const totalCarts = await prisma.abandonedCart.count({
            where: {
                ...whereClause,
                createdAt: { gte: thirtyDaysAgo }
            }
        })
        const conversionRate = (totalOrders + totalCarts) > 0
            ? (totalOrders / (totalOrders + totalCarts)) * 100
            : 0

        // Funnel Data (Mocked/Approximated)
        const funnel = [
            { step: 'Besucher', count: (totalOrders + totalCarts) * 5, conversion: 100 }, // Assume 20% add to cart
            { step: 'Warenkorb', count: totalOrders + totalCarts, conversion: 20 },
            { step: 'Erstkauf', count: totalOrders, conversion: Math.round((totalOrders / (totalOrders + totalCarts)) * 100) },
            { step: 'Rabatt gesendet', count: Math.floor(totalOrders * 0.8), conversion: 80 }, // 80% eligible
            { step: 'Zweiter Kauf', count: Math.floor(totalOrders * 0.2), conversion: 20 }, // 20% return
        ]

        return NextResponse.json({
            stats: {
                newCustomers,
                automationRevenue: recoveredRevenue,
                conversionRate: Math.round(conversionRate * 10) / 10,
                activeAutomations: activeCount
            },
            funnel
        })

    } catch (error) {
        console.error('Error fetching marketing stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
