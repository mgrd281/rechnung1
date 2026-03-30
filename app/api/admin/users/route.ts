export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const search = url.searchParams.get('search') || ''
        const role = url.searchParams.get('role') || 'all'

        const where: any = {}

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (role !== 'all') {
            where.role = role.toUpperCase()
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                isSuspended: true,
                lastLoginAt: true,
                createdAt: true,
                country: true,
                lastIp: true
            }
        })

        return NextResponse.json({ users })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}
