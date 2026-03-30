import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Fetch all critical data
        const [invoices, customers, digitalProducts, orders, users] = await Promise.all([
            prisma.invoice.findMany({ include: { items: true, customer: true } }),
            prisma.customer.findMany(),
            prisma.digitalProduct.findMany(),
            prisma.order.findMany(),
            prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } }) // Exclude passwords
        ])

        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                invoices,
                customers,
                digitalProducts,
                orders,
                users
            }
        }

        return NextResponse.json(backupData)

    } catch (error) {
        console.error('Error generating backup:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
