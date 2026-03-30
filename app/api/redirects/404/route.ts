import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'open'
        const limit = parseInt(searchParams.get('limit') || '50')

        const brokenLinks = await prisma.brokenLink.findMany({
            where: {
                organizationId,
                resolved: status === 'resolved'
            },
            orderBy: { hits: 'desc' },
            take: limit
        })

        return NextResponse.json(brokenLinks)
    } catch (error) {
        console.error('Error fetching broken links:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
