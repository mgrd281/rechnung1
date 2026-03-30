export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { auth } from "@/lib/auth"
import { subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // @ts-ignore
        const organizationId = session.user.organizationId
        const whereClause = organizationId ? { organizationId } : {}

        const range = parseInt(request.nextUrl.searchParams.get('range') || '30')
        const endDate = new Date()
        const startDate = subDays(endDate, range)

        const users = await prisma.user.findMany({
            where: {
                ...whereClause,
                createdAt: {
                    gte: startDate
                }
            },
            select: {
                createdAt: true
            }
        })

        // Group by day
        const groupedData: Record<string, number> = {}

        // Initialize all days with 0
        for (let i = 0; i <= range; i++) {
            const date = subDays(endDate, i)
            const key = format(date, 'yyyy-MM-dd')
            groupedData[key] = 0
        }

        // Count users
        users.forEach(user => {
            const key = format(user.createdAt, 'yyyy-MM-dd')
            if (groupedData[key] !== undefined) {
                groupedData[key]++
            }
        })

        // Convert to array and sort
        const chartData = Object.entries(groupedData)
            .map(([date, count]) => ({
                date,
                count,
                formattedDate: format(new Date(date), 'dd.MM')
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        return NextResponse.json(chartData)
    } catch (error) {
        console.error('Growth fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch growth data' }, { status: 500 })
    }
}
