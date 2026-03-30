import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { AccountingInvoice, InvoiceStatus } from '@/lib/accounting-types'

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const statusFilter = searchParams.get('status')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    // Find organization
    const organization = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } }
    }) || await prisma.organization.findFirst()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Build query
    const where: any = {
      organizationId: organization.id
    }

    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      where.issueDate = { ...where.issueDate, gte: start }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.issueDate = { ...where.issueDate, lte: end }
    }

    // Status filter (mapped from frontend 'bezahlt' etc to Prisma 'PAID' etc)
    if (statusFilter && statusFilter !== '') {
      const statusArray = statusFilter.split(',') as InvoiceStatus[]
      // We need to handle 'offen' mapping to multiple statuses (DRAFT, SENT)
      const prismaStatuses: string[] = []

      statusArray.forEach(s => {
        if (s === 'offen') {
          prismaStatuses.push('DRAFT', 'SENT')
        } else if (s === 'bezahlt') {
          prismaStatuses.push('PAID')
        } else if (s === 'überfällig') {
          prismaStatuses.push('OVERDUE')
        } else if (s === 'storniert' || s === 'erstattet') {
          prismaStatuses.push('CANCELLED')
        }
      })

      if (prismaStatuses.length > 0) {
        where.status = { in: prismaStatuses }
      }
    }

    if (minAmount) {
      where.totalGross = { ...where.totalGross, gte: parseFloat(minAmount) }
    }
    if (maxAmount) {
      where.totalGross = { ...where.totalGross, lte: parseFloat(maxAmount) }
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        payments: true
      },
      orderBy: { issueDate: 'desc' }
    })

    // Convert to accounting format
    const accountingInvoices: AccountingInvoice[] = invoices.map(invoice => {
      const status = mapPrismaStatusToFrontend(invoice.status)

      // Determine paid date
      let paidDate: string | undefined
      if (status === 'bezahlt') {
        const payment = invoice.payments.find(p => p.status === 'COMPLETED')
        paidDate = payment ? payment.paymentDate.toISOString() : invoice.updatedAt.toISOString()
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer?.name || 'Unbekannter Kunde',
        customerTaxId: invoice.customer?.taxId || undefined,
        date: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        status: status,
        subtotal: Number(invoice.totalNet),
        taxRate: 19, // Default or derived
        taxAmount: Number(invoice.totalTax),
        totalAmount: Number(invoice.totalGross),
        paidDate: paidDate,
        category: 'revenue',
        description: invoice.items?.[0]?.description || 'Rechnung',
        accountingAccount: '8400', // Default revenue account
        costCenter: '',
        bookingText: `Rechnung ${invoice.invoiceNumber}`
      }
    })

    return NextResponse.json({
      success: true,
      invoices: accountingInvoices,
      total: accountingInvoices.length
    })

  } catch (error) {
    console.error('Error fetching accounting invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounting invoices' },
      { status: 500 }
    )
  }
}

function mapPrismaStatusToFrontend(status: string): InvoiceStatus {
  const map: Record<string, InvoiceStatus> = {
    'PAID': 'bezahlt',
    'SENT': 'offen',
    'DRAFT': 'offen',
    'OVERDUE': 'überfällig',
    'CANCELLED': 'storniert'
  }
  return map[status] || 'offen'
}
