
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const tickets = await prisma.supportTicket.findMany({
            orderBy: { updatedAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        })
        return NextResponse.json({ success: true, data: tickets })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }
}
