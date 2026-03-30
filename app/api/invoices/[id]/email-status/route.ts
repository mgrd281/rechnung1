export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Mock storage für E-Mail-Status
declare global {
  var invoiceEmailStatus: Record<string, {
    sent: boolean
    sentAt?: string
    sentTo?: string
    messageId?: string
    lastAttempt?: string
  }> | undefined
}

if (!global.invoiceEmailStatus) {
  global.invoiceEmailStatus = {}
}

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: invoiceId } = await params
    const status = global.invoiceEmailStatus![invoiceId] || {
      sent: false
    }

    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('Fehler beim Abrufen des E-Mail-Status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des E-Mail-Status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: invoiceId } = await params
    const { sent, sentTo, messageId } = await request.json()

    // E-Mail-Status aktualisieren
    global.invoiceEmailStatus![invoiceId] = {
      sent: sent,
      sentAt: sent ? new Date().toISOString() : undefined,
      sentTo: sentTo,
      messageId: messageId,
      lastAttempt: new Date().toISOString()
    }

    console.log(`📧 E-Mail-Status für Rechnung ${invoiceId} aktualisiert:`, global.invoiceEmailStatus![invoiceId])

    return NextResponse.json({
      success: true,
      message: 'E-Mail-Status aktualisiert',
      status: global.invoiceEmailStatus![invoiceId]
    })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des E-Mail-Status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des E-Mail-Status' },
      { status: 500 }
    )
  }
}
