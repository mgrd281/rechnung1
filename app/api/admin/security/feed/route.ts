export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organizationId: true }
        });

        const organizationId = user?.organizationId
        const whereClause = organizationId ? { organizationId } : {}

        const feed = await prisma.blockedUserAttempt.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json(feed)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }
}
