export const dynamic = "force-dynamic"

import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    req: Request,
    { params }: { params: any }
) {
    try {
        const { id: ticketId } = await params

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
        }

        await prisma.supportTicket.delete({
            where: { id: ticketId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting ticket:', error)
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params // Assuming params is an object with an 'id' property, and potentially awaitable
        const ticketId = id as string // Cast to string for type safety with prisma

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId }
        })

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: ticket })
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest, // Changed req: Request to request: NextRequest
    { params }: { params: any } // Changed params type to any
) {
    try {
        const { id } = await params // Changed how id is extracted
        const ticketId = id as string // Cast to string for type safety with prisma
        const body = await request.json() // Changed req.json() to request.json()
        const { status, subject } = body

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
        }

        const ticket = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                ...(status && { status }),
                ...(subject && { subject })
            }
        })

        return NextResponse.json({ success: true, data: ticket })
    } catch (error) {
        console.error('Error updating ticket:', error)
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }
}
