export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';
import { ensureOrganization } from '@/lib/db-operations'

async function getOrganizationId(session: any) {
    if (session.user?.organizationId) return session.user.organizationId

    if (!session.user?.email) return 'default-org-id'

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true }
    })

    if (user?.organizationId) return user.organizationId

    const org = await ensureOrganization()
    return org.id
}

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = await getOrganizationId(session)

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''

        const where: any = { organizationId }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ]
        }

        const blockedUsers = await prisma.blockedUser.findMany({
            where,
            orderBy: { blockedAt: 'desc' }
        })

        return NextResponse.json(blockedUsers)
    } catch (error) {
        console.error('Error fetching blocked users:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = await getOrganizationId(session)
        const body = await req.json()
        const { email, name, reason } = body

        if (!email) {
            return new NextResponse('Email is required', { status: 400 })
        }

        // Check if already blocked
        const existing = await prisma.blockedUser.findFirst({
            where: {
                organizationId,
                email: { equals: email, mode: 'insensitive' }
            }
        })

        if (existing) {
            return new NextResponse('User is already blocked', { status: 400 })
        }

        const blockedUser = await prisma.blockedUser.create({
            data: {
                organizationId,
                email: email.trim(),
                name,
                reason,
                blockedBy: session.user.email || 'Admin'
            }
        })

        return NextResponse.json(blockedUser)
    } catch (error) {
        console.error('Error blocking user:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// Statistics endpoint
export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = await getOrganizationId(session)

        const [totalBlocked, attemptsThisWeek, recentAttempts] = await Promise.all([
            prisma.blockedUser.count({ where: { organizationId } }),
            prisma.blockedUserAttempt.count({
                where: {
                    organizationId,
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            prisma.blockedUserAttempt.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    email: true,
                    attemptType: true,
                    createdAt: true
                }
            })
        ])

        return NextResponse.json({
            totalBlocked,
            attemptsThisWeek,
            recentAttempts
        })
    } catch (error) {
        console.error('Error fetching stats:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
