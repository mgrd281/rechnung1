export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceEmail, verifyEmailConfig } from '@/lib/email-service'
import { getCompanySettings } from '@/lib/company-settings'
import { logInvoiceEvent } from '@/lib/invoice-history'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invoiceId,
      customerEmail,
      customerName,
      invoiceNumber,
      emailSubject,
      emailMessage,
      invoiceAmount,
      dueDate
    } = body

    console.log('Processing email send request for invoice:', invoiceNumber)

    // Validate required fields
    if (!invoiceId || !customerEmail || !customerName || !invoiceNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende erforderliche Felder: invoiceId, customerEmail, customerName, invoiceNumber'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige E-Mail-Adresse'
        },
        { status: 400 }
      )
    }

    // Check email configuration
    const isConfigValid = await verifyEmailConfig()
    if (!isConfigValid) {
      console.error('Email configuration is invalid')
      return NextResponse.json(
        {
          success: false,
          error: 'E-Mail-Konfiguration ist ungültig. Bitte überprüfen Sie die Einstellungen.',
          details: 'Email service configuration failed verification'
        },
        { status: 500 }
      )
    }

    // Get company settings for email
    const companySettings = getCompanySettings()

    // Send the actual email with custom subject and message
    const result = await sendInvoiceEmail(
      invoiceId,
      customerEmail,
      customerName,
      invoiceNumber,
      companySettings.name,
      emailSubject,
      emailMessage,
      invoiceAmount,
      dueDate
    )

    if (result.success) {
      console.log(`✅ Email sent successfully to ${customerEmail}`)
      console.log(`📝 Message ID: ${result.messageId}`)
      console.log(`📊 Log ID: ${result.logId}`)

      let successMessage = `Rechnung ${invoiceNumber} wurde erfolgreich an ${customerEmail} gesendet.`

      // Log history
      await logInvoiceEvent(invoiceId, 'SENT', `E-Mail an ${customerEmail} gesendet`)

      // Add CC confirmation if CC is configured
      if (process.env.EMAIL_CC) {
        successMessage += ` Eine Kopie wurde an ${process.env.EMAIL_CC} gesendet.`
      }

      return NextResponse.json({
        success: true,
        message: successMessage,
        messageId: result.messageId,
        logId: result.logId,
        sentAt: new Date().toISOString(),
        ccSent: !!process.env.EMAIL_CC
      })
    } else {
      throw new Error(result.error || 'Email sending failed')
    }

  } catch (error) {
    console.error('Error in email API endpoint:', error)

    // Provide specific error messages based on error type
    let errorMessage = 'Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.'
    let statusCode = 500

    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('domain is not verified')) {
        errorMessage = 'Die Absenderdomain ist bei Resend nicht verifiziert. Bitte Domain auf resend.com verifizieren oder RESEND_FROM_EMAIL=onboarding@resend.dev in der Entwicklung verwenden.'
      } else if (msg.includes('only send testing emails') || msg.includes('testing emails to your own email address')) {
        errorMessage = 'Resend (Testmodus): Sie können Test-E-Mails nur an Ihre eigene E-Mail-Adresse senden. Senden Sie an die im Resend-Konto hinterlegte Adresse oder verifizieren Sie Ihre Domain und nutzen Sie dann shop@karinex.de als Absender.'
      } else if (error.message.includes('authentication') || error.message.includes('auth')) {
        errorMessage = 'E-Mail-Authentifizierung fehlgeschlagen. Bitte überprüfen Sie die Anmeldedaten.'
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = 'Netzwerkfehler beim E-Mail-Versand. Bitte überprüfen Sie Ihre Internetverbindung.'
      } else if (error.message.includes('configuration')) {
        errorMessage = 'E-Mail-Konfigurationsfehler. Bitte wenden Sie sich an den Administrator.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'E-Mail-Versandlimit erreicht. Bitte versuchen Sie es später erneut.'
        statusCode = 429
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
}

