export const dynamic = "force-dynamic"
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    include: {
                        payments: true
                    }
                },
                payments: {
                    orderBy: { paymentDate: 'desc' }
                },
                licenseKeys: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        digitalProduct: true
                    }
                },
                supportTickets: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                },
                emails: {
                    orderBy: { receivedAt: 'desc' }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!customer) {
            return new NextResponse('Customer not found', { status: 404 })
        }

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Error fetching customer:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const customer = await prisma.customer.update({
            where: { id },
            data: body
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Error updating customer:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params

        await prisma.customer.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
