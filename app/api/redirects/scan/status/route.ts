import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const lastJob = await prisma.redirectScanJob.findFirst({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(lastJob || { status: 'IDLE' })
    } catch (error) {
        console.error('Error fetching scan status:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
