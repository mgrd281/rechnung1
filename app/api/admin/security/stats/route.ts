export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { subHours } from 'date-fns'

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

        const now = new Date()
        const last24h = subHours(now, 24)

        const [
            activeThreats,
            blockedToday,
            failedLogins,
            totalBlockedIps,
            totalBlockedEmails,
            securitySettings,
            totalStorefrontVisits
        ] = await Promise.all([
            prisma.blockedUserAttempt.count({
                where: {
                    ...whereClause,
                    createdAt: { gte: subHours(now, 1) },
                    blocked: false
                }
            }),
            prisma.blockedUserAttempt.count({
                where: {
                    ...whereClause,
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                    blocked: true
                }
            }),
            prisma.blockedUserAttempt.count({
                where: {
                    ...whereClause,
                    createdAt: { gte: last24h },
                    attemptType: 'LOGIN_FAILED'
                }
            }),
            prisma.blockedIp.count({ where: whereClause }),
            prisma.blockedUser.count({ where: whereClause }),
            organizationId ? prisma.securitySettings.findUnique({
                where: { organizationId }
            }) : null,
            prisma.storefrontVisit.count({ where: whereClause })
        ])

        let riskLevel = 'Low'
        if (activeThreats > 50) riskLevel = 'High'
        else if (activeThreats > 10) riskLevel = 'Medium'

        return NextResponse.json({
            activeThreats,
            blockedToday,
            failedLogins,
            riskLevel,
            totalBlocked: totalBlockedIps + totalBlockedEmails,
            storefrontBlockingEnabled: securitySettings?.storefrontBlockingEnabled ?? true,
            totalStorefrontVisits
        })
    } catch (error) {
        console.error('Security stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
