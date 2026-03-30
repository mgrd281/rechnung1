
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
        // We use a transaction to get a consistent snapshot if possible, or just parallel queries
        const [
            organizations,
            users,
            customers,
            orders,
            invoices,
            invoiceItems,
            payments,
            expenses,
            reviews,
            settings
        ] = await Promise.all([
            prisma.organization.findMany(),
            prisma.user.findMany(),
            prisma.customer.findMany(),
            prisma.order.findMany(),
            prisma.invoice.findMany(),
            prisma.invoiceItem.findMany(),
            prisma.payment.findMany(),
            prisma.expense.findMany(),
            prisma.review.findMany(),
            prisma.widgetSettings.findMany()
        ])

        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                organizations,
                users,
                customers,
                orders,
                invoices,
                invoiceItems,
                payments,
                expenses,
                reviews,
                settings
            }
        }

        const jsonString = JSON.stringify(backupData, null, 2)
        const filename = `backup-${new Date().toISOString().split('T')[0]}.json`

        return new NextResponse(jsonString, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error: any) {
        console.error('Backup error:', error)
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
