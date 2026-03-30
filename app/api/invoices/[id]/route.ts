import { NextRequest, NextResponse } from 'next/server'
import { getCompanySettings } from '@/lib/company-settings'
import { prisma } from '@/lib/prisma'
import { ensureOrganization, ensureCustomer, ensureTaxRate } from '@/lib/db-operations'
import { Prisma } from '@prisma/client'
import { logInvoiceEvent } from '@/lib/invoice-history'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { deepRepairUTF8 } from '@/lib/utf8-fixer';

// Helper to map Prisma status to Frontend status
function mapPrismaStatusToFrontend(status: string): string {
  switch (status) {
    case 'PAID': return 'Bezahlt'
    case 'SENT': return 'Offen'
    case 'OVERDUE': return 'Mahnung'
    case 'CANCELLED': return 'Storniert'
    case 'DRAFT': return 'Entwurf'
    default: return 'Offen'
  }
}

// Helper to map Frontend status to Prisma status
function mapFrontendStatusToPrisma(status: string): 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
  switch (status) {
    case 'Bezahlt': return 'PAID'
    case 'Offen': return 'SENT'
    case 'Mahnung': return 'OVERDUE'
    case 'Storniert': return 'CANCELLED'
    case 'Erstattet':
    case 'Gutschrift': return 'PAID'
    default: return 'SENT'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: invoiceId } = await params
    console.log('Fetching invoice with ID:', invoiceId)

    // Fetch from Prisma
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: {
          include: {
            taxRate: true
          }
        },
        order: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!invoice) {
      console.log('Rechnung nicht gefunden in DB:', invoiceId)
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    console.log('Rechnung gefunden:', invoice.invoiceNumber)


    // Format for frontend
    const settings = (invoice.settings as any) || {}
    const design = settings.design || {
      templateId: 'classic',
      themeColor: '#1e293b',
      logoScale: 1.0,
      showSettings: {
        qrCode: false,
        epcQrCode: false,
        customerNumber: true,
        contactPerson: true,
        vatPerItem: false,
        articleNumber: false,
        foldMarks: true
      }
    }

    const formattedInvoice = {
      id: invoice.id,
      number: invoice.invoiceNumber,
      date: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      subtotal: Number(invoice.totalNet),
      taxRate: 19, // Approximation or fetch from items
      taxAmount: Number(invoice.totalTax),
      total: Number(invoice.totalGross),
      status: mapPrismaStatusToFrontend(invoice.status),
      customer: {
        id: invoice.customer.id,
        name: deepRepairUTF8((invoice as any).customerName || invoice.customer.name || 'Gast'),
        companyName: '', // Add to schema if needed
        email: (invoice as any).customerEmail || invoice.customer.email || '',
        address: invoice.customer.address,
        zipCode: invoice.customer.zipCode,
        city: invoice.customer.city,
        country: invoice.customer.country,
        phone: (invoice as any).customerPhone
      },
      customerName: deepRepairUTF8((invoice as any).customerName),
      customerEmail: (invoice as any).customerEmail,
      customerPhone: (invoice as any).customerPhone,
      isGuestCheckout: (invoice as any).isGuestCheckout,
      shopifyCustomerId: (invoice as any).shopifyCustomerId,
      organization: getCompanySettings(),
      items: invoice.items.map(item => ({
        id: item.id,
        description: deepRepairUTF8(item.description),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        vat: (item as any).taxRate?.value || 19, // Use actual rate or default to 19
        total: Number(item.netAmount),
        ean: (item as any).ean,
        kaufquelleSnapshot: (item as any).kaufquelleSnapshot,
        kaufdatumSnapshot: (item as any).kaufdatumSnapshot,
        kaufpreisSnapshot: (item as any).kaufpreisSnapshot ? Number((item as any).kaufpreisSnapshot) : null,
        shopifyProductId: (item as any).shopifyProductId,
        shopifyVariantId: (item as any).shopifyVariantId
      })),
      // Document type fields
      document_kind: (invoice as any).documentKind,
      reference_number: (invoice as any).reference_number,
      paymentMethod: (invoice.settings as any)?.paymentMethod, // Get from settings
      original_invoice_date: (invoice as any).originalDate?.toISOString().split('T')[0],
      grund: (invoice as any).reason,
      refund_amount: (invoice as any).refundAmount ? Number((invoice as any).refundAmount) : undefined,
      // Invoice text fields
      headerSubject: deepRepairUTF8(invoice.headerSubject) || null,
      headerText: invoice.headerText || null,
      footerText: invoice.footerText || null,
      serviceDate: invoice.serviceDate ? invoice.serviceDate.toISOString().split('T')[0] : null,
      // Design & Layout
      design: design,
      // Order details
      order: invoice.order ? {
        id: invoice.order.id,
        shopifyOrderId: invoice.order.shopifyOrderId
      } : undefined,
      history: (invoice as any).history || [],
      settings: invoice.settings || {}
    }

    return NextResponse.json(formattedInvoice)

  } catch (error) {
    console.error('Fehler beim Abrufen der Rechnung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Rechnung' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: invoiceId } = await params
    const updatedData = await request.json()

    console.log('Aktualisiere Rechnung mit ID:', invoiceId)

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Update Customer if provided
    if (updatedData.customer) {
      await ensureCustomer(existingInvoice.organizationId, updatedData.customer)
      // Note: We might want to update the specific customer record linked to this invoice
      // or just update the invoice's customerId if it changed.
      // For simplicity, let's assume we update the linked customer details
      await prisma.customer.update({
        where: { id: existingInvoice.customerId },
        data: {
          name: updatedData.customer.name,
          email: updatedData.customer.email,
          address: updatedData.customer.address,
          zipCode: updatedData.customer.zipCode,
          city: updatedData.customer.city,
          country: updatedData.customer.country
        }
      })
    }

    // Update Invoice fields
    const updateData: Prisma.InvoiceUpdateInput = {}
    if (updatedData.status) updateData.status = mapFrontendStatusToPrisma(updatedData.status)
    if (updatedData.subtotal) updateData.totalNet = updatedData.subtotal
    if (updatedData.total) updateData.totalGross = updatedData.total
    if (updatedData.taxAmount) updateData.totalTax = updatedData.taxAmount

    if (updatedData.customer) {
      updateData.customerName = updatedData.customer.name
      updateData.customerEmail = updatedData.customer.email
      updateData.customerPhone = updatedData.customer.phone
    }


    if (updatedData.paymentMethod || updatedData.design) {
      const currentSettings = (existingInvoice.settings as any) || {}
      updateData.settings = {
        ...currentSettings,
        design: updatedData.design || currentSettings.design,
        paymentMethod: updatedData.paymentMethod || currentSettings.paymentMethod
      }
    }

    // Update items if provided
    if (updatedData.items) {
      // Delete existing items and recreate (simplest approach for full update)
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } })

      const taxRateObj = await ensureTaxRate(existingInvoice.organizationId, updatedData.taxRate || 19)

      updateData.items = {
        create: await Promise.all(updatedData.items.map(async (item: any) => {
          const net = item.total
          const taxRate = updatedData.taxRate || 19
          const tax = net * (taxRate / 100)
          const gross = net + tax

          // Optional: Update global product/variant purchase info
          if (updatedData.updateGlobalPurchaseInfo && (item.shopifyVariantId || item.shopifyProductId)) {
            try {
              const kaufpreisCents = item.kaufpreisSnapshot ? Math.round(Number(item.kaufpreisSnapshot) * 100) : null

              await prisma.purchaseInfo.upsert({
                where: {
                  organizationId_variantId: item.shopifyVariantId ? {
                    organizationId: existingInvoice.organizationId,
                    variantId: String(item.shopifyVariantId)
                  } : undefined,
                  organizationId_productId: (!item.shopifyVariantId && item.shopifyProductId) ? {
                    organizationId: existingInvoice.organizationId,
                    productId: String(item.shopifyProductId)
                  } : undefined,
                } as any,
                create: {
                  organizationId: existingInvoice.organizationId,
                  variantId: item.shopifyVariantId ? String(item.shopifyVariantId) : null,
                  productId: item.shopifyProductId ? String(item.shopifyProductId) : null,
                  kaufquelle: item.kaufquelleSnapshot || null,
                  kaufdatum: item.kaufdatumSnapshot ? new Date(item.kaufdatumSnapshot) : null,
                  kaufpreisCents: kaufpreisCents
                },
                update: {
                  kaufquelle: item.kaufquelleSnapshot || null,
                  kaufdatum: item.kaufdatumSnapshot ? new Date(item.kaufdatumSnapshot) : null,
                  kaufpreisCents: kaufpreisCents
                }
              })
            } catch (err) {
              console.error('Failed to update global PurchaseInfo:', err)
            }
          }

          const repairedDescription = deepRepairUTF8(item.description);
          return {
            description: repairedDescription,
            normalizedDescription: repairedDescription.toLowerCase().replace(/[ _|]/g, ' ').replace(/\s+/g, ' ').trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRateId: taxRateObj.id,
            netAmount: net,
            grossAmount: gross,
            taxAmount: tax,
            ean: item.ean,
            kaufquelleSnapshot: item.kaufquelleSnapshot || null,
            kaufdatumSnapshot: item.kaufdatumSnapshot ? new Date(item.kaufdatumSnapshot) : null,
            kaufpreisSnapshot: item.kaufpreisSnapshot || null,
            shopifyProductId: item.shopifyProductId || null,
            shopifyVariantId: item.shopifyVariantId || null
          }
        }))
      }
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData
    })

    if (updatedData.status && updatedData.status !== mapPrismaStatusToFrontend(existingInvoice.status)) {
      await logInvoiceEvent(invoiceId, 'STATUS_CHANGE', `Status geändert zu ${updatedData.status}`)
    }

    console.log('Rechnung erfolgreich aktualisiert')
    return NextResponse.json({ success: true, message: 'Rechnung erfolgreich aktualisiert' })

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Rechnung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Rechnung' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: invoiceId } = await params
    console.log('Lösche Rechnung mit ID:', invoiceId)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Hard delete for now as we don't have deletedAt
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    console.log('Rechnung erfolgreich gelöscht')
    return NextResponse.json({
      success: true,
      message: 'Rechnung erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Rechnung:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Löschen',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      },
      { status: 500 }
    )
  }
}
