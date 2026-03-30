import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()

        let organizationId = session?.user?.organizationId

        // Fallback: Fetch from DB if session has email but no organizationId
        if (!organizationId && session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { organizationId: true }
            })
            organizationId = user?.organizationId
        }

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'Nicht autorisiert' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'new'
        const limit = parseInt(searchParams.get('limit') || '50')
        const sortBy = searchParams.get('sortBy') || 'firstSeen'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        // Build where clause
        const where: any = {
            organizationId: organizationId
        }

        if (status && status !== 'all') {
            where.status = status
        }

        // Fetch products
        const products = await (prisma as any).productCandidate.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder
            },
            take: limit,
            include: {
                competitorPrices: {
                    orderBy: {
                        price: 'asc'
                    }
                }
            }
        })

        // Get total count
        const total = await (prisma as any).productCandidate.count({ where })

        return NextResponse.json({
            success: true,
            products,
            total
        })

    } catch (error: any) {
        console.error('[API] Error fetching product candidates:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
