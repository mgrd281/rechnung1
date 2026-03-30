export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { InvoiceType, generateInvoiceNumber, createRefundItems, ExtendedInvoice } from '@/lib/invoice-types'
import { checkAndLogBlockedUser } from '@/lib/blocklist'

// Mock storage - in einer echten Anwendung würde dies eine Datenbank sein
declare global {
  var csvInvoices: any[] | undefined
}

if (!global.csvInvoices) {
  global.csvInvoices = []
}

export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const {
      refundItems,
      reason,
      refundMethod,
      processingNotes
    } = await request.json()

    const { id: invoiceId } = await params

    // Validierung der Eingabedaten
    if (!refundItems || Object.keys(refundItems).length === 0) {
      return NextResponse.json(
        { error: 'Keine Rückerstattungspositionen angegeben' },
        { status: 400 }
      )
    }

    // Ursprüngliche Rechnung finden
    const originalInvoice = global.csvInvoices?.find(inv => inv.id === invoiceId)

    if (!originalInvoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // ========== BLOCKLIST CHECK ==========
    const customerEmail = originalInvoice.customerEmail
    const organizationId = 'default-org-id'

    if (customerEmail) {
      console.log(`🛡️ Checking blocklist for refund request: ${customerEmail}`)
      const blockCheck = await checkAndLogBlockedUser({
        email: customerEmail,
        organizationId,
        attemptType: 'REFUND_REQUEST',
        invoiceId: invoiceId,
        ipAddress: undefined,
        userAgent: undefined
      })

      if (blockCheck.blocked) {
        console.log(`🚫 BLOCKED USER REFUND ATTEMPT: ${customerEmail} - Reason: ${blockCheck.reason}`)
        console.log(`⚠️ Refund for invoice ${originalInvoice.number} requires manual review`)

        // Mark invoice for manual review instead of processing automatic refund
        return NextResponse.json({
          success: false,
          blocked: true,
          message: 'Refund request from blocked user requires manual review',
          reason: blockCheck.reason,
          requiresManualReview: true
        }, { status: 403 })
      }
    }
    // ========== END BLOCKLIST CHECK ==========

    // Prüfen ob Rechnung rückerstattungsfähig ist
    if (originalInvoice.type !== InvoiceType.REGULAR) {
      return NextResponse.json(
        { error: 'Nur normale Rechnungen können rückerstattet werden' },
        { status: 400 }
      )
    }

    if (originalInvoice.status === 'Storniert') {
      return NextResponse.json(
        { error: 'Stornierte Rechnungen können nicht rückerstattet werden' },
        { status: 400 }
      )
    }

    // Validierung der Rückerstattungsmengen
    for (const [itemId, quantity] of Object.entries(refundItems)) {
      const originalItem = originalInvoice.items.find((item: any) => item.id === itemId)
      if (!originalItem) {
        return NextResponse.json(
          { error: `Rechnungsposition ${itemId} nicht gefunden` },
          { status: 400 }
        )
      }

      const refundQuantity = Number(quantity)
      if (refundQuantity > originalItem.quantity) {
        return NextResponse.json(
          { error: `Rückerstattungsmenge für "${originalItem.description}" überschreitet die ursprüngliche Menge` },
          { status: 400 }
        )
      }
    }

    // Neue Rechnungsnummer für Gutschrift generieren
    const refundNumber = generateInvoiceNumber(
      InvoiceType.REFUND,
      (global.csvInvoices?.length || 0) + 1
    )

    // Rückerstattungs-Positionen erstellen
    const refundItemsList = createRefundItems(originalInvoice.items, refundItems)

    // Rückerstattungsbeträge berechnen
    const refundSubtotal = refundItemsList.reduce((sum, item) => sum + item.total, 0)
    const refundTaxAmount = refundSubtotal * (originalInvoice.taxRate / 100)
    const refundTotal = refundSubtotal + refundTaxAmount

    // Gutschrift erstellen
    const refundInvoice: ExtendedInvoice = {
      id: `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      number: refundNumber,
      type: InvoiceType.REFUND,
      customerId: originalInvoice.customerId,
      customerName: originalInvoice.customerName,
      customerEmail: originalInvoice.customerEmail,
      customerAddress: originalInvoice.customerAddress,
      customerCity: originalInvoice.customerCity,
      customerZip: originalInvoice.customerZip,
      customerCountry: originalInvoice.customerCountry,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0], // Gutschrift sofort fällig
      items: refundItemsList,
      subtotal: refundSubtotal,
      taxRate: originalInvoice.taxRate,
      taxAmount: refundTaxAmount,
      total: refundTotal,
      status: 'Gutschrift',
      statusColor: 'bg-blue-100 text-blue-800',
      amount: `€${Math.abs(refundTotal).toFixed(2)}`,
      createdAt: new Date().toISOString(),

      // Rückerstattungs-spezifische Felder
      originalInvoiceId: originalInvoice.id,
      originalInvoiceNumber: originalInvoice.number,
      reason: reason || 'Teilrückerstattung auf Kundenwunsch',
      refundMethod: refundMethod || 'bank_transfer',
      processingNotes: processingNotes
    }

    // Gutschrift zur Liste hinzufügen
    global.csvInvoices!.push(refundInvoice)

    // Ursprüngliche Rechnung mit Rückerstattungshinweis aktualisieren
    const originalIndex = global.csvInvoices!.findIndex(inv => inv.id === invoiceId)
    if (originalIndex !== -1) {
      const existingNotes = originalInvoice.processingNotes || ''
      global.csvInvoices![originalIndex] = {
        ...originalInvoice,
        processingNotes: existingNotes +
          `\nTeilrückerstattung ${refundNumber} am ${new Date().toLocaleDateString('de-DE')} über €${Math.abs(refundTotal).toFixed(2)}`
      }
    }

    console.log(`✅ Gutschrift ${refundNumber} für Rechnung ${originalInvoice.number} erstellt`)

    return NextResponse.json({
      success: true,
      message: `Gutschrift ${refundNumber} wurde erfolgreich erstellt`,
      refundInvoice,
      refundAmount: Math.abs(refundTotal),
      originalInvoiceUpdated: true
    })

  } catch (error) {
    console.error('Fehler beim Erstellen der Gutschrift:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Gutschrift' },
      { status: 500 }
    )
  }
}
