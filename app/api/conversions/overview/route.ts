import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { auth } from "@/lib/auth"
import { startOfDay, subDays, endOfDay, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orgId = session.user.organizationId; // Or derive from context if not on user
        // Assuming user acts on behalf of first org if not set or handled by middleware
        const searchParams = request.nextUrl.searchParams
        const range = searchParams.get('range') || '30d'
        
        // Calculate date range
        let fromDate = subDays(new Date(), 30)
        let toDate = endOfDay(new Date())

        if (range === '7d') fromDate = subDays(new Date(), 7)
        if (range === 'today') fromDate = startOfDay(new Date())
        if (range === '90d') fromDate = subDays(new Date(), 90)
        
        // 1. Group by Source (Pie Chart / Table)
        const bySource = await prisma.invoice.groupBy({
            by: ['trafficSourceLabel', 'trafficSourceKey'],
            where: {
                // organizationId: orgId, // Uncomment if using real orgs
                issueDate: { gte: fromDate, lte: toDate },
                status: { notIn: ['DRAFT', 'CANCELLED'] } // Only valid orders
            },
            _sum: {
                totalGross: true
            },
            _count: {
                _all: true
            }
        })

        // 2. Map to nice format
        const sources = bySource.map(item => ({
            key: item.trafficSourceKey || 'unknown',
            label: item.trafficSourceLabel || 'Unbekannt',
            count: item._count._all,
            revenue: Number(item._sum.totalGross || 0),
            avgOrder: item._count._all > 0 ? Number(item._sum.totalGross || 0) / item._count._all : 0
        })).sort((a,b) => b.revenue - a.revenue)

        // 3. Totals
        const totals = {
            revenue: sources.reduce((acc, curr) => acc + curr.revenue, 0),
            orders: sources.reduce((acc, curr) => acc + curr.count, 0)
        }

        // 4. Over Time Data (for Charts) 
        // We can't easily group by date AND source in one prisma query without raw SQL or post-processing
        // Let's fetch all invoices in range and group manually for granular charts
        // Or grouped by Date first
        // Simple approach: Group by Date
        const byDate = await prisma.invoice.findMany({
            where: {
                issueDate: { gte: fromDate, lte: toDate },
                status: { notIn: ['DRAFT', 'CANCELLED'] }
            },
            select: {
                issueDate: true,
                totalGross: true,
                trafficSourceKey: true
            }
        })
        
        // Process for chart
        // Structure: { date: 'YYYY-MM-DD', google: 120, facebook: 50 ... }
        const chartDataMap = new Map()
        
        byDate.forEach(inv => {
            const dateKey = format(inv.issueDate, 'yyyy-MM-dd')
            const sourceKey = inv.trafficSourceKey || 'other'
            
            if (!chartDataMap.has(dateKey)) {
                chartDataMap.set(dateKey, { date: dateKey, total: 0 })
            }
            const entry = chartDataMap.get(dateKey)
            
            entry[sourceKey] = (entry[sourceKey] || 0) + Number(inv.totalGross)
            entry.total += Number(inv.totalGross)
        })

        const chartData = Array.from(chartDataMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date))

        return NextResponse.json({
            sources,
            totals,
            chartData
        })

    } catch (error: any) {
        console.error('Analytics Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
