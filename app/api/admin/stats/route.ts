export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        // Ensure authentication
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // @ts-ignore - organizationId is added in auth-options
        const organizationId = session.user.organizationId

        // Build filter: If user has an org, scope by it. If not (and is admin?), maybe show all? 
        // Request says "Must be tenant-scoped". So we strictly filter by organizationId if present.
        // If user has NO organizationId (maybe Super Admin or just unassigned), we might return 0 or global depending on rule.
        // Assuming every relevant user has an organizationId. If not, fallback to empty stats.

        const whereClause = organizationId ? { organizationId } : {}

        // For "Admins", we filter by role='ADMIN' AND the organization scope
        // For "Verified", we filter by emailVerified NOT null AND organization scope
        // For "Active Today", we filter by lastLoginAt today AND organization scope

        const [totalUsers, verifiedUsers, adminUsers, activeToday] = await Promise.all([
            prisma.user.count({ where: whereClause }),
            prisma.user.count({
                where: {
                    ...whereClause,
                    emailVerified: { not: null }
                }
            }),
            prisma.user.count({
                where: {
                    ...whereClause,
                    role: 'ADMIN'
                }
            }),
            prisma.user.count({
                where: {
                    ...whereClause,
                    lastLoginAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ])

        return NextResponse.json({
            totalUsers,
            verifiedUsers,
            adminUsers,
            activeToday
        })
    } catch (error) {
        console.error('Stats fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
