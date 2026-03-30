
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, shouldShowAllData } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const auth = requireAuth(request)
        if ('error' in auth) return auth.error
        const { user } = auth

        if (!shouldShowAllData(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({ logs })
    } catch (error) {
        console.error('Error fetching audit logs:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
