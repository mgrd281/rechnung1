import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  generateCSVContent,
  generateCSVFilename,
  InvoiceExportData
} from '@/lib/csv-export'
import { logAuditAction } from '@/lib/audit-logs'

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      selectedIds,
      filters,
      columns,
      includeSummary = true,
      filename
    } = body

    // 1. Resolve Organization
    // @ts-ignore
    let organizationId = session.user.organizationId
    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst()
      organizationId = firstOrg?.id
    }

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'No organization context found' }, { status: 400 })
    }

    // 2. Build Query
    const where: any = {
      organizationId: organizationId,
    }

    // Filter by selected IDs if provided
    if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
      where.id = { in: selectedIds }
    } else {
      // Apply filters if no specific IDs are selected
      if (filters) {
        if (filters.dateFrom) {
          where.issueDate = { ...where.issueDate, gte: new Date(filters.dateFrom) }
        }
        if (filters.dateTo) {
          where.issueDate = { ...where.issueDate, lte: new Date(filters.dateTo) }
        }
        if (filters.status && filters.status !== 'all') {
          where.status = filters.status
        }
        if (filters.searchQuery) {
          where.OR = [
            { invoiceNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
            { customerName: { contains: filters.searchQuery, mode: 'insensitive' } },
            { customerEmail: { contains: filters.searchQuery, mode: 'insensitive' } },
            { orderNumber: { contains: filters.searchQuery, mode: 'insensitive' } }
          ]
        }
      }
    }

    // 3. Fetch Data
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      include: {
        customer: true,
      }
    })

    if (invoices.length === 0) {
      // Still return headers but no data
      console.log('⚠️ No invoices found for export')
    }

    // 4. Map to Export Format
    const exportData: InvoiceExportData[] = invoices.map((inv: any) => ({
      id: inv.id,
      datum: inv.issueDate,
      bestellnummer: inv.orderNumber || '',
      rechnungsnummer: inv.invoiceNumber,
      kundeName: inv.customerName || inv.customer?.name || 'Gast',
      kundeEmail: inv.customerEmail || inv.customer?.email || '',
      betrag: Number(inv.totalGross),
      mwst: Number(inv.totalTax),
      waehrung: inv.currency,
      zahlung: inv.paymentMethod || 'Unbekannt',
      status: inv.financialStatus || inv.status,
      bezahltBetrag: inv.totalPaidCents ? inv.totalPaidCents / 100 : 0,
      shopifyOrderId: inv.shopifyOrderId || undefined,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt
    }))

    // 5. Generate CSV
    const csvContent = generateCSVContent(exportData, {
      columns,
      includeSummary
    })

    const csvFilename = generateCSVFilename(filename)

    // 6. Audit Logging
    await logAuditAction({
      organizationId,
      userId: (session.user as any).id,
      action: 'EXPORT_CSV',
      entityType: 'INVOICE',
      details: {
        count: exportData.length,
        filename: csvFilename,
        filters: filters || (selectedIds ? { selectedIdsCount: selectedIds.length } : 'none')
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // 7. Return Result
    return NextResponse.json({
      success: true,
      filename: csvFilename,
      rowCount: exportData.length,
      totalAmount: exportData.reduce((sum, inv) => sum + inv.betrag, 0),
      downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
      message: `${exportData.length} Rechnungen erfolgreich exportiert`
    })

  } catch (error) {
    console.error('❌ CSV Export Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim CSV-Export: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'columns') {
    const { CSV_COLUMNS } = await import('@/lib/csv-export')
    return NextResponse.json({
      success: true,
      columns: CSV_COLUMNS.map(col => ({
        key: col.key,
        label: col.label,
        type: col.type
      }))
    })
  }

  return NextResponse.json({
    success: true,
    info: {
      maxRows: 100000,
      supportedFormats: ['CSV'],
      encoding: 'UTF-8 with BOM'
    }
  })
}
