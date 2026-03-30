import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }
        const { user } = authResult

        // Get organization
        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        }) || await prisma.organization.findFirst()

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // 1. Get Totals
        const totalInvoices = await prisma.invoice.count({
            where: { organizationId: organization.id }
        })

        const totalExpenses = await prisma.expense.count({
            where: { organizationId: organization.id }
        })

        const totalAdditionalIncome = await prisma.additionalIncome.count({
            where: { organizationId: organization.id }
        })

        // 2. Get Distribution by Year for Additional Income (since that's the issue)
        // We use raw query or just group by in application code if dataset is small enough, 
        // but for 2500+ items, let's just fetch dates and aggregate in memory to be safe across DB types
        const allIncomeDates = await prisma.additionalIncome.findMany({
            where: { organizationId: organization.id },
            select: { date: true }
        })

        const incomeByYear: Record<string, number> = {}
        allIncomeDates.forEach(item => {
            const year = new Date(item.date).getFullYear().toString()
            incomeByYear[year] = (incomeByYear[year] || 0) + 1
        })

        return NextResponse.json({
            success: true,
            organization: {
                id: organization.id,
                name: organization.name
            },
            counts: {
                invoices: totalInvoices,
                expenses: totalExpenses,
                additionalIncome: totalAdditionalIncome,
                total: totalInvoices + totalExpenses + totalAdditionalIncome
            },
            distribution: {
                incomeByYear
            }
        })

    } catch (error) {
        console.error('Diagnose stats error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
