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

        // 1. Offener Betrag Gesamt (Overdue Invoices)
        // Aggregation of totalGross for invoices with status OVERDUE
        const overdueInvoices = await prisma.invoice.aggregate({
            _sum: {
                totalGross: true
            },
            where: {
                ...whereClause,
                status: 'OVERDUE'
            }
        })
        const totalOpenAmount = Number(overdueInvoices._sum.totalGross || 0)

        // 2. Active Mahnläufe (Invoices currently OVERDUE)
        const activeRuns = await prisma.invoice.count({
            where: {
                ...whereClause,
                status: 'OVERDUE'
            }
        })

        // 3. Wiederhergestellt (recovered) in last 30 days
        // Invoices that were once overdue/dunning but are now PAID in last 30 days.
        // This is hard to track perfectly without status history tables, but we can approximate:
        // Invoices PAID in last 30 days that have DunningLogs.
        const recoveredInvoices = await prisma.invoice.findMany({
            where: {
                ...whereClause,
                status: 'PAID',
                updatedAt: { gte: thirtyDaysAgo }, // Paid recently
                dunningLogs: {
                    some: {} // Had at least one dunning log
                }
            },
            include: {
                dunningLogs: true
            }
        })

        const recoveredAmount = recoveredInvoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0)

        // 4. Success Rate
        // Recovered / (Recovered + Currently Overdue) ideally.
        // Or simply: recovered count / (recovered count + overdue count)
        const totalRelevant = recoveredInvoices.length + activeRuns
        const successRate = totalRelevant > 0 ? (recoveredInvoices.length / totalRelevant) * 100 : 0

        // 6. Funnel data for display
        const funnel = [
            { step: 'Fällig', count: activeRuns + recoveredInvoices.length, conversion: 100 },
            { step: 'Erinnerung', count: Math.floor((activeRuns + recoveredInvoices.length) * 0.8), conversion: 80 },
            { step: 'Mahnung 1', count: Math.floor((activeRuns + recoveredInvoices.length) * 0.5), conversion: 62 },
            { step: 'Mahnung 2', count: Math.floor((activeRuns + recoveredInvoices.length) * 0.3), conversion: 60 },
            { step: 'Letzte Mahnung', count: Math.floor((activeRuns + recoveredInvoices.length) * 0.1), conversion: 33 },
            { step: 'Bezahlt', count: recoveredInvoices.length, conversion: Math.round(successRate) },
        ]

        // 5. Trend Analytics (Mocking for now to provide the structure)
        const stats = {
            openAmount: totalOpenAmount,
            recoveredAmount,
            activeRuns,
            successRate: Math.round(successRate),
            trends: {
                openAmount: 12, // +12% vs last month
                recoveredAmount: -5, // -5% vs last month
                successRate: 3
            },
            series: [
                { date: '2024-03-01', value: 400 },
                { date: '2024-03-05', value: 300 },
                { date: '2024-03-10', value: 600 },
                { date: '2024-03-15', value: 800 },
                { date: '2024-03-20', value: 500 },
                { date: '2024-03-25', value: recoveredAmount },
            ]
        }

        return NextResponse.json({
            stats,
            funnel
        })

    } catch (error) {
        console.error('Error fetching recovery stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
