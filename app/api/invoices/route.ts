import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';
import { Prisma, InvoiceStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

import { deepRepairUTF8 } from '@/lib/utf8-fixer';

function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[ _|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500) // Cap limit at 500
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const dateRange = searchParams.get('dateRange') || 'all'

    const skip = (page - 1) * limit

    const where: Prisma.InvoiceWhereInput = {}

    // Search filter
    if (search) {
      const terms = search.split(',').map(t => t.trim()).filter(Boolean);

      if (terms.length > 0) {
        const andConditions: Prisma.InvoiceWhereInput[] = [];

        for (const termRaw of terms) {
          const termNormalized = normalizeForSearch(termRaw);

          const termOR: Prisma.InvoiceWhereInput[] = [];

          // 1. Raw matches for codes/emails
          termOR.push(
            { invoiceNumber: { contains: termRaw, mode: 'insensitive' } },
            { orderNumber: { contains: termRaw, mode: 'insensitive' } },
            { shopifyOrderNumber: { contains: termRaw, mode: 'insensitive' } },
            { customerEmail: { contains: termRaw, mode: 'insensitive' } },
            { customer: { email: { contains: termRaw, mode: 'insensitive' } } }
          );

          // 2. Normalized matches for names/descriptions
          termOR.push(
            { normalizedCustomerName: { contains: termNormalized, mode: 'insensitive' } },
            { customerName: { contains: termNormalized, mode: 'insensitive' } },
            { customer: { name: { contains: termNormalized, mode: 'insensitive' } } },
            { items: { some: { normalizedDescription: { contains: termNormalized, mode: 'insensitive' } } } },
            { items: { some: { description: { contains: termNormalized, mode: 'insensitive' } } } }
          );

          andConditions.push({ OR: termOR });
        }

        if (andConditions.length === 1) {
          const firstOR = (andConditions[0] as any).OR;
          where.OR = firstOR;
        } else {
          where.AND = andConditions;
        }
      }
    }
    // Status filter
    if (status !== 'all') {
      const s = status.toUpperCase()
      if (s === 'REFUND' || s === 'GUTSCHRIFT') {
        where.documentKind = { in: ['CREDIT_NOTE', 'REFUND_FULL', 'REFUND_PARTIAL'] }
      } else if (s === 'OFFEN' || s === 'OPEN' || s === 'SENT') {
        where.status = 'SENT'
      } else if (s === 'BEZAHLT' || s === 'PAID') {
        where.status = 'PAID'
      } else if (s === 'STORNIERT' || s === 'CANCELLED') {
        where.status = 'CANCELLED'
      } else if (s === 'ÜBERFÄLLIG' || s === 'UEBERFAELLIG' || s === 'OVERDUE') {
        where.status = 'OVERDUE'
      } else {
        where.status = status as InvoiceStatus
      }
    }

    // Date range filter
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (from || to) {
      where.issueDate = {}
      if (from) where.issueDate.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.issueDate.lte = toDate
      }
    } else {
      const now = new Date()
      if (dateRange === 'today') {
        const start = new Date(now.setHours(0, 0, 0, 0))
        const end = new Date(now.setHours(23, 59, 59, 999))
        where.issueDate = { gte: start, lte: end }
      } else if (dateRange === 'week') {
        const start = new Date(now.setDate(now.getDate() - 7))
        where.issueDate = { gte: start }
      } else if (dateRange === 'month') {
        const start = new Date(now.setMonth(now.getMonth() - 1))
        where.issueDate = { gte: start }
      } else if (dateRange === 'year') {
        const start = new Date(now.setFullYear(now.getFullYear() - 1))
        where.issueDate = { gte: start }
      }
    }

    // Execute query
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              grossAmount: true,
              netAmount: true,
              taxAmount: true
            }
          },
          order: true
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    // Calculate detailed stats using aggregations for performance
    const statsWhere = { ...where };
    delete statsWhere.status;
    delete statsWhere.documentKind;

    // 1. Get counts by status and documentKind
    const statusCounts = await prisma.invoice.groupBy({
      by: ['status', 'documentKind'],
      where: statsWhere,
      _count: { _all: true },
      _sum: { totalGross: true, totalTax: true }
    });

    let totalPaidAmount = 0
    let totalRefundAmount = 0
    let totalVat19 = 0
    let totalVat7 = 0
    let totalShopifyFees = 0
    let paidInvoicesCount = 0
    let openInvoicesCount = 0
    let overdueInvoicesCount = 0
    let cancelledInvoicesCount = 0
    let refundInvoicesCount = 0
    let totalAmount = 0

    const normalizeStatus = (s: string) => s?.toUpperCase().trim() || ''

    // Calculate Shopify Payments fees for paid invoices using Shopify Payments
    // Shopify Payments typically charges: 2.9% + €0.30 per transaction
    const shopifyPaymentInvoices = await prisma.invoice.findMany({
      where: {
        ...statsWhere,
        paymentMethod: { in: ['Shopify Payments', 'shopify_payments'] },
        status: 'PAID'
      },
      select: {
        id: true,
        totalGross: true,
        settings: true
      }
    })

    // Calculate and sum Shopify fees
    for (const inv of shopifyPaymentInvoices) {
      const settings = (inv.settings as any) || {}
      
      // Check if fee is already stored in settings
      if (settings.shopifyPaymentsFee && typeof settings.shopifyPaymentsFee === 'number') {
        totalShopifyFees += settings.shopifyPaymentsFee
      } else {
        // Calculate using standard Shopify Payments rate: 2.9% + €0.30
        const grossAmount = Number(inv.totalGross)
        const calculatedFee = (grossAmount * 0.029) + 0.30
        totalShopifyFees += calculatedFee
      }
    }

    for (const group of statusCounts) {
      const s = normalizeStatus(group.status as any)
      const isRefund = group.documentKind === 'CREDIT_NOTE' || group.documentKind === 'REFUND_FULL' || group.documentKind === 'REFUND_PARTIAL' || s === 'GUTSCHRIFT'
      const count = group._count._all
      const amount = Number(group._sum.totalGross || 0)
      const tax = Number(group._sum.totalTax || 0)

      totalAmount += amount

      if (!isRefund) {
        if (s === 'PAID' || s === 'BEZAHLT') {
          totalPaidAmount += amount
          paidInvoicesCount += count
        } else if (s === 'SENT' || s === 'OFFEN' || s === 'OPEN' || s === 'PENDING') {
          openInvoicesCount += count
        } else if (s === 'OVERDUE' || s === 'ÜBERFÄLLIG' || s === 'UEBERFAELLIG') {
          overdueInvoicesCount += count
        } else if (s === 'CANCELLED' || s === 'STORNIERT') {
          cancelledInvoicesCount += count
        }
      } else {
        refundInvoicesCount += count
        totalRefundAmount += amount
      }

      if (s !== 'CANCELLED' && s !== 'STORNIERT') {
        // This is still a simplification as we don't know the rate, 
        // but it's consistent with existing logic and much faster.
        totalVat19 += tax
      }
    }

    // Map to frontend format
    const mappedInvoices = invoices.map(inv => {
      // Determine UI type based on documentKind and status
      const s = String(inv.status).toUpperCase();
      let type = 'REGULAR';
      if (s === 'CANCELLED' || s === 'STORNIERT') type = 'CANCELLATION';
      else if (inv.documentKind !== 'INVOICE') type = 'REFUND';

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.issueDate.toISOString(),
        dueDate: inv.dueDate?.toISOString(),
        status: inv.status,
        documentKind: inv.documentKind,
        statusColor: '', // Handled by helper function in frontend
        type: type, // Critical for frontend logic
        customer: {
          name: (inv as any).customerName || inv.customer.name,
          email: (inv as any).customerEmail || inv.customer.email,
          address: inv.customer.address,
          city: inv.customer.city,
          zip: inv.customer.zipCode,
          country: inv.customer.country,
        },
        customerName: (inv as any).customerName,
        customerEmail: (inv as any).customerEmail,
        customerPhone: (inv as any).customerPhone,
        customerCity: inv.customer.city,
        customerZip: inv.customer.zipCode,
        isGuestCheckout: (inv as any).isGuestCheckout,
        shopifyCustomerId: (inv as any).shopifyCustomerId,
        vorkasseReminderLevel: inv.order?.vorkasseReminderLevel || 0,
        vorkasseLastReminderAt: inv.order?.vorkasseLastReminderAt?.toISOString() || null,
        items: inv.items.map((item: any) => ({
          id: item.id,
          description: deepRepairUTF8(item.description),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.grossAmount),
          taxRate: 0
        })),
        subtotal: Number(inv.totalNet),
        taxTotal: Number(inv.totalTax),
        total: Number(inv.totalGross),
        amount: String(inv.totalGross), // String fallback
        currency: inv.currency || 'EUR',
        number: inv.invoiceNumber,
        orderNumber: inv.orderNumber || (inv.order?.shopifyOrderId ? (inv.order.shopifyOrderId.startsWith('#') ? inv.order.shopifyOrderId : `#${inv.order.shopifyOrderId}`) : inv.order?.orderNumber),
        order: inv.order ? {
          id: inv.order.id,
          orderNumber: inv.order.orderNumber,
          shopifyOrderId: inv.order.shopifyOrderId,
          totalAmount: Number(inv.order.totalAmount),
          createdAt: inv.order.createdAt.toISOString(),
          vorkasseReminderLevel: inv.order.vorkasseReminderLevel,
          vorkasseLastReminderAt: inv.order.vorkasseLastReminderAt?.toISOString(),
        } : null,
        paymentMethod: inv.paymentMethod || 'Shopify Payments',
        settings: inv.settings,
      }
    })

    return NextResponse.json({
      invoices: mappedInvoices,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      stats: {
        totalAmount,
        count: statusCounts.reduce((acc, g) => acc + g._count._all, 0),
        totalPaidAmount,
        totalRefundAmount,
        paidInvoicesCount,
        openInvoicesCount,
        overdueInvoicesCount,
        cancelledInvoicesCount,
        refundInvoicesCount,
        totalVat19,
        totalVat7,
        totalShopifyFees
      }
    })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {

      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const organizationId = (session.user as any).organizationId

    if (!organizationId) {
      return new NextResponse('Organization context missing', { status: 400 })
    }

    // 1. Resolve Template (use default if not specified)
    let templateId = body.templateId
    if (!templateId) {
      const defaultTemplate = await prisma.invoiceTemplate.findFirst({
        where: { organizationId, isDefault: true }
      })
      templateId = defaultTemplate?.id
    }

    if (!templateId) {
      const anyTemplate = await prisma.invoiceTemplate.findFirst({
        where: { organizationId }
      })
      templateId = anyTemplate?.id
    }

    if (!templateId) {
      return new NextResponse('Kein Rechnungs-Template gefunden. Bitte erst ein Template erstellen.', { status: 400 })
    }

    // 2. Customer UPSERT (identity resolution)
    let customerId = body.customerId

    if (!customerId) {
      const email = body.customer.email?.toLowerCase().trim()
      const name = body.customer.name.trim()
      const zip = body.customer.zipCode || ''
      const city = body.customer.city || ''

      // Look for existing customer
      let existingCustomer = null

      if (email) {
        existingCustomer = await prisma.customer.findFirst({
          where: { organizationId, email }
        })
      }

      if (!existingCustomer) {
        // Fallback search by name + zip + city
        existingCustomer = await prisma.customer.findFirst({
          where: {
            organizationId,
            name: { equals: name, mode: 'insensitive' },
            zipCode: zip,
            city: { equals: city, mode: 'insensitive' }
          }
        })
      }

      if (existingCustomer) {
        // Update customer if data changed
        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: name || existingCustomer.name,
            email: email || existingCustomer.email,
            phone: body.customer.phone || existingCustomer.phone,
            address: body.customer.address || existingCustomer.address,
            zipCode: zip || existingCustomer.zipCode,
            city: city || existingCustomer.city,
            taxId: body.customer.taxId || existingCustomer.taxId,
            status: 'ACTIVE'
          }
        })
        customerId = updatedCustomer.id
      } else {
        // Create new customer
        const newCustomer = await prisma.customer.create({
          data: {
            organizationId,
            name,
            normalizedName: normalizeForSearch(name),
            email,
            phone: body.customer.phone || '',
            address: body.customer.address || '',
            zipCode: zip,
            city,
            country: body.customer.country || 'DE',
            taxId: body.customer.taxId || '',
            status: 'ACTIVE'
          }
        })
        customerId = newCustomer.id
      }
    }


    // 3. Create invoice matched to customer
    const design = body.design || {}

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        issueDate: new Date(body.date),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
        status: (body.status || 'DRAFT') as InvoiceStatus,
        totalNet: body.subtotal,
        totalTax: body.taxTotal,
        totalGross: body.total,
        currency: body.currency || 'EUR',
        paymentMethod: body.paymentMethod || 'Überweisung',
        orderNumber: body.orderNumber,
        organization: { connect: { id: organizationId } },
        template: { connect: { id: templateId } },
        customer: { connect: { id: customerId } },
        settings: {
          design: design,
          paymentMethod: body.paymentMethod
        },
        items: {
          create: body.items.map((item: any) => ({
            description: item.description,
            normalizedDescription: normalizeForSearch(item.description),
            ean: item.ean || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            grossAmount: item.total,
            netAmount: item.netAmount || item.total,
            taxAmount: item.taxAmount || 0,
            taxRate: {
              connect: { id: item.taxRateId || 'default-tax-rate' }
            }
          }))
        }
      },
      include: {
        customer: true,
        items: true
      }
    })

    return NextResponse.json({ ok: true, data: invoice })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
