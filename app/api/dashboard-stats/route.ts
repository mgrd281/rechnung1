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

    // Get all invoices with their details
    const allInvoices = await prisma.invoice.findMany({
      include: { customer: true }
    })

    console.log('🔍 Debug Stats - First 3 invoices:', allInvoices.slice(0, 3).map(inv => ({
      id: inv.id,
      status: inv.status,
      totalGross: inv.totalGross,
      typeOfTotalGross: typeof inv.totalGross
    })))

    // Calculate statistics
    const totalInvoices = allInvoices.length
    const customerCount = await prisma.customer.count()

    // Helper to safely convert Decimal/Number/String to number
    const toNumber = (val: any) => {
      if (!val) return 0
      if (typeof val === 'number') return val
      if (val && typeof val === 'object' && 'toNumber' in val) return val.toNumber()
      return Number(val.toString())
    }

    // Calculate revenue (sum of all invoice totals)
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + toNumber(inv.totalGross), 0)

    // Filter by status - support both English (Prisma enum) and German (Legacy/Import) values
    // Normalize status for comparison
    const normalizeStatus = (s: string) => s?.toUpperCase().trim() || ''

    const paidInvoices = allInvoices.filter(inv => {
      const s = normalizeStatus(inv.status as any)
      return s === 'PAID' || s === 'BEZAHLT'
    })
    const openInvoices = allInvoices.filter(inv => {
      const s = normalizeStatus(inv.status as any)
      return s === 'SENT' || s === 'OFFEN' || s === 'OPEN' || s === 'PENDING'
    })
    const overdueInvoices = allInvoices.filter(inv => {
      const s = normalizeStatus(inv.status as any)
      return s === 'OVERDUE' || s === 'ÜBERFÄLLIG' || s === 'UEBERFAELLIG'
    })
    const cancelledInvoices = allInvoices.filter(inv => {
      const s = normalizeStatus(inv.status as any)
      return s === 'CANCELLED' || s === 'STORNIERT'
    })

    // Note: REFUND is not in the enum, but we'll keep it for backwards compatibility
    const refundInvoices = allInvoices.filter(inv => inv.documentKind === 'CREDIT_NOTE' || inv.documentKind === 'REFUND_FULL' || inv.documentKind === 'REFUND_PARTIAL')

    // Calculate amounts for each status
    const paidInvoicesAmount = paidInvoices.reduce((sum, inv) => sum + toNumber(inv.totalGross), 0)
    const openInvoicesAmount = openInvoices.reduce((sum, inv) => sum + toNumber(inv.totalGross), 0)
    const overdueInvoicesAmount = overdueInvoices.reduce((sum, inv) => sum + toNumber(inv.totalGross), 0)
    const refundInvoicesAmount = refundInvoices.reduce((sum, inv) => sum + toNumber(inv.totalGross), 0)
    const cancelledInvoicesAmount = cancelledInvoices.reduce((sum, inv) => sum + toNumber(inv.totalGross), 0)

    // Get recent invoices
    const recentInvoices = allInvoices
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 5)
      .map(inv => ({
        id: inv.id,
        number: inv.invoiceNumber,
        customer: inv.customer.name,
        amount: Number(inv.totalGross),
        status: inv.status,
        date: inv.issueDate.toISOString()
      }))

    const stats = {
      totalRevenue,
      totalInvoices,
      totalCustomers: customerCount,
      paidInvoicesCount: paidInvoices.length,
      paidInvoicesAmount,
      openInvoicesCount: openInvoices.length,
      openInvoicesAmount,
      overdueInvoicesCount: overdueInvoices.length,
      overdueInvoicesAmount,
      refundInvoicesCount: refundInvoices.length,
      refundInvoicesAmount,
      cancelledInvoicesCount: cancelledInvoices.length,
      cancelledInvoicesAmount,
      recentInvoices
    }

    console.log('📊 Dashboard Stats:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Error',
        data: {
          totalRevenue: 0,
          totalInvoices: 0,
          totalCustomers: 0,
          paidInvoicesCount: 0,
          paidInvoicesAmount: 0,
          openInvoicesCount: 0,
          openInvoicesAmount: 0,
          overdueInvoicesCount: 0,
          overdueInvoicesAmount: 0,
          refundInvoicesCount: 0,
          refundInvoicesAmount: 0,
          cancelledInvoicesCount: 0,
          cancelledInvoicesAmount: 0,
          recentInvoices: []
        }
      },
      { status: 500 }
    )
  }
}
