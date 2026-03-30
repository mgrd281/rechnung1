import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'all'

        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { supplierName: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (status !== 'all') {
            where.status = status
        }

        const [invoices, total] = await Promise.all([
            prisma.purchaseInvoice.findMany({
                where,
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: limit,
            }),
            prisma.purchaseInvoice.count({ where })
        ])

        // Calculate stats
        const allInvoices = await prisma.purchaseInvoice.findMany({
            where: { ...where, status: undefined }, // Total stats regardless of filter
            select: { grossAmount: true, status: true }
        })

        const stats = {
            totalAmount: allInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grossAmount), 0),
            paidAmount: allInvoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, inv: any) => sum + Number(inv.grossAmount), 0),
            openAmount: allInvoices.filter((i: any) => i.status === 'PENDING').reduce((sum: number, inv: any) => sum + Number(inv.grossAmount), 0),
            count: allInvoices.length,
            paidCount: allInvoices.filter((i: any) => i.status === 'PAID').length,
            openCount: allInvoices.filter((i: any) => i.status === 'PENDING').length,
        }

        return NextResponse.json({
            success: true,
            data: invoices,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            },
            stats
        })

    } catch (error: any) {
        console.error('[Purchase Invoices API] Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Ensure organization exists (take first as fallback)
        let orgId = body.organizationId
        if (!orgId) {
            const org = await prisma.organization.findFirst()
            orgId = org?.id
        }

        if (!orgId) {
            return NextResponse.json({ success: false, error: 'No organization found' }, { status: 400 })
        }

        const invoice = await prisma.purchaseInvoice.create({
            data: {
                invoiceNumber: body.invoiceNumber,
                supplierName: body.supplierName || body.vendorName,
                invoiceDate: new Date(body.invoiceDate || body.date),
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                currency: body.currency || 'EUR',
                netAmount: parseFloat(body.netAmount || body.totalNet || body.subtotal || 0),
                taxAmount: parseFloat(body.taxAmount || body.totalTax || body.taxTotal || 0),
                grossAmount: parseFloat(body.grossAmount || body.totalGross || body.total || 0),
                category: body.category || 'General',
                notes: body.notes || '',
                fileUrl: body.fileUrl || null,
                documentId: body.documentId || null,
                ocrData: body.ocrData || null,
                confidence: body.confidence !== undefined ? parseFloat(body.confidence) : null,
                status: body.status || 'PENDING',
                organization: {
                    connect: { id: orgId }
                }
            }
        })

        return NextResponse.json({ success: true, data: invoice })

    } catch (error: any) {
        console.error('[Purchase Invoices API POST] Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
