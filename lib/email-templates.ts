// Email template utilities for invoice emails

export function generateInvoiceEmailTemplate(
  customerName: string,
  invoiceNumber: string,
  companyName: string
) {
  return {
    subject: `Rechnung ${invoiceNumber} von ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Rechnung ${invoiceNumber}</h2>
        
        <p>Sehr geehrte/r ${customerName},</p>
        
        <p>anbei erhalten Sie Ihre Rechnung ${invoiceNumber}.</p>
        
        <p>Die Rechnung finden Sie als PDF-Anhang zu dieser E-Mail.</p>
        
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        
        <p>Mit freundlichen Grüßen<br>
        ${companyName}</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="font-size: 12px; color: #6b7280;">
          Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
        </p>
      </div>
    `,
    text: `
Rechnung ${invoiceNumber}

Sehr geehrte/r ${customerName},

anbei erhalten Sie Ihre Rechnung ${invoiceNumber}.

Die Rechnung finden Sie als PDF-Anhang zu dieser E-Mail.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
${companyName}

---
Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
    `
  }
}
