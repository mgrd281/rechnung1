export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30d' // 7d, 30d, 90d

        let daysToSubtract = 30
        if (period === '7d') daysToSubtract = 7
        if (period === '90d') daysToSubtract = 90

        const startDate = startOfDay(subDays(new Date(), daysToSubtract))

        // 1. Fetch Invoices for the period
        const invoices = await prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startDate
                }
            },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                status: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // 2. Aggregate Data for Charts (Group by Day)
        const chartMap = new Map<string, { date: string, revenue: number, paid: number, open: number }>()

        // Initialize map with 0 values for all days
        for (let i = 0; i <= daysToSubtract; i++) {
            const date = subDays(new Date(), daysToSubtract - i)
            const dateStr = format(date, 'yyyy-MM-dd')
            chartMap.set(dateStr, { date: dateStr, revenue: 0, paid: 0, open: 0 })
        }

        invoices.forEach(inv => {
            const dateStr = format(inv.createdAt, 'yyyy-MM-dd')
            const entry = chartMap.get(dateStr)
            if (entry) {
                const amount = Number(inv.totalAmount) || 0
                entry.revenue += amount
                if (inv.status === 'PAID') entry.paid += amount
                if (inv.status === 'OPEN' || inv.status === 'SENT') entry.open += amount
            }
        })

        const chartData = Array.from(chartMap.values())

        // 3. Overall KPI Aggregations (Total Lifetime or Total Current Period? - Let's do Period for Trends, Lifetime for Totals)
        // Actually, Dashboards usually show Period totals for the top charts, but Lifetime totals are often requested for "All Time Revenue". 
        // The user request "Financial Overview KPIs" usually implies accumulated status unless filtered. 
        // Let's compute PERIOD totals for the "Trends" and "Charts", but for the TOP KPIs we might want global or period.
        // Let's stick to PERIOD totals for consistency with the filter.

        const totalRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0)
        const paidAmount = invoices
            .filter(i => i.status === 'PAID')
            .reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0)
        const openAmount = invoices
            .filter(i => i.status === 'OPEN' || i.status === 'SENT')
            .reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0)
        const overdueAmount = invoices
            .filter(i => i.status === 'OVERDUE')
            .reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0)

        // 4. Status Breakdown
        const statusCounts = invoices.reduce((acc: any, inv) => {
            acc[inv.status] = (acc[inv.status] || 0) + 1
            return acc
        }, {})

        // 5. Generate Insights (Mock logic based on data)
        const insights = []
        if (openAmount > 0) {
            insights.push({
                type: 'opportunity',
                text: `${invoices.filter(i => i.status === 'OPEN').length} Rechnungen sind offen – möglicher Umsatz ${openAmount.toFixed(2)}€`
            })
        }
        if (overdueAmount > 0) {
            insights.push({
                type: 'warning',
                text: `${invoices.filter(i => i.status === 'OVERDUE').length} Rechnungen sind überfällig`
            })
        }
        const avgValue = invoices.length > 0 ? (totalRevenue / invoices.length) : 0
        insights.push({
            type: 'info',
            text: `Durchschnittlicher Rechnungswert: ${avgValue.toFixed(2)}€`
        })

        return NextResponse.json({
            success: true,
            data: {
                kpis: {
                    totalRevenue,
                    paidAmount,
                    openAmount,
                    overdueAmount,
                    avgValue
                },
                chartData,
                statusCounts,
                insights
            }
        })

    } catch (error) {
        console.error('Financial stats error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch financial stats' }, { status: 500 })
    }
}
