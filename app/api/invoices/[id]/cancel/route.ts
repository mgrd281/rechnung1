export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { InvoiceType, generateInvoiceNumber } from '@/lib/invoice-types'

export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const {
      reason,
      processingNotes,
      cancellationNumber: providedNumber,
      date: providedDate,
      refundMethod
    } = await request.json()
    const { id: invoiceId } = await params

    // 1. Fetch original invoice from Prisma
    const originalInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        customer: true,
        order: true,
        organization: true
      }
    })

    if (!originalInvoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // 2. Check if already cancelled
    if (originalInvoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Diese Rechnung wurde bereits storniert' },
        { status: 400 }
      )
    }

    // 3. Check if it's a regular invoice
    // Assuming 'INVOICE' is the standard documentKind for regular invoices
    if (originalInvoice.documentKind !== 'INVOICE' && originalInvoice.documentKind !== 'REGULAR') {
      return NextResponse.json(
        { error: 'Nur normale Rechnungen können storniert werden' },
        { status: 400 }
      )
    }

    // 4. Cancel Shopify Order if linked
    if (originalInvoice.order?.shopifyOrderId) {
      try {
        const shopify = new ShopifyAPI()
        const shopifyOrderId = parseInt(originalInvoice.order.shopifyOrderId)

        console.log(`Attempting to cancel Shopify order ${shopifyOrderId}...`)
        try {
          await shopify.cancelOrder(shopifyOrderId)
          console.log(`✅ Shopify order ${shopifyOrderId} cancelled successfully`)
        } catch (cancelError: any) {
          console.warn(`⚠️ Could not cancel order ${shopifyOrderId}, trying refund/close instead. Reason:`, cancelError.message || cancelError)

          // If cancellation fails (e.g. because it's fulfilled), try to refund it fully
          // This effectively "cancels" the financial part and marks items as returned
          await shopify.fullyRefundOrder(shopifyOrderId)
          console.log(`✅ Shopify order ${shopifyOrderId} refunded successfully`)
        }
      } catch (shopifyError) {
        console.error('⚠️ Failed to cancel/refund Shopify order:', shopifyError)
        // We continue with invoice cancellation even if Shopify fails
      }
    }

    // 5. Generate Storno Invoice Number
    let stornoNumber = providedNumber

    if (!stornoNumber) {
      const invoiceCount = await prisma.invoice.count({
        where: { organizationId: originalInvoice.organizationId }
      })

      stornoNumber = generateInvoiceNumber(
        InvoiceType.CANCELLATION,
        invoiceCount + 1
      )
    }

    // 6. Calculate Amounts (Negative)
    const totalNet = Number(originalInvoice.totalNet) * -1
    const totalGross = Number(originalInvoice.totalGross) * -1
    const totalTax = Number(originalInvoice.totalTax) * -1

    // 7. Create Storno Invoice in Prisma
    const stornoInvoice = await prisma.invoice.create({
      data: {
        organizationId: originalInvoice.organizationId,
        customerId: originalInvoice.customerId,
        templateId: originalInvoice.templateId, // Use same template
        invoiceNumber: stornoNumber,
        issueDate: providedDate ? new Date(providedDate) : new Date(),
        dueDate: providedDate ? new Date(providedDate) : new Date(), // Storno is due immediately
        totalNet: totalNet,
        totalGross: totalGross,
        totalTax: totalTax,
        currency: originalInvoice.currency,
        status: 'CANCELLED', // Or PAID? Usually Storno is considered settled/paid by the refund
        documentKind: 'CANCELLATION',

        // Link to original
        referenceNumber: originalInvoice.invoiceNumber,
        originalDate: originalInvoice.issueDate,
        reason: reason || 'Stornierung',

        // Copy settings/texts
        headerSubject: `Stornorechnung zu ${originalInvoice.invoiceNumber}`,
        headerText: originalInvoice.headerText,
        footerText: originalInvoice.footerText,
        settings: {
          ...(originalInvoice.settings as object || {}),
          refundMethod: refundMethod,
          processingNotes: processingNotes
        },

        // Create negative items
        items: {
          create: originalInvoice.items.map(item => ({
            description: `STORNO: ${item.description}`,
            quantity: Number(item.quantity) * -1,
            unitPrice: Number(item.unitPrice), // Price stays same, quantity becomes negative
            taxRateId: item.taxRateId,
            netAmount: Number(item.netAmount) * -1,
            grossAmount: Number(item.grossAmount) * -1,
            taxAmount: Number(item.taxAmount) * -1,
            ean: item.ean
          }))
        }
      }
    })

    // 8. Update Original Invoice Status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        reason: reason, // Store reason on original too?
        // We might want to store the link to the storno invoice somewhere, 
        // but currently there's no direct field for "cancellationInvoiceId" on Invoice.
        // We can rely on referenceNumber in the storno invoice.
      }
    })

    console.log(`✅ Storno invoice ${stornoNumber} created for ${originalInvoice.invoiceNumber}`)

    return NextResponse.json({
      success: true,
      message: `Stornorechnung ${stornoNumber} wurde erfolgreich erstellt`,
      stornoInvoice,
      originalInvoiceUpdated: true
    })

  } catch (error) {
    console.error('Fehler beim Erstellen der Stornorechnung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Stornorechnung: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
