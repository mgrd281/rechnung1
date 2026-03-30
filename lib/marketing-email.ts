import { sendEmail } from './email-service'

export async function sendFirstPurchaseDiscountEmail(
    email: string,
    customerName: string,
    discountCode: string,
    subject: string,
    bodyTemplate: string
) {
    // Replace placeholders
    // We handle basic newlines to <br> conversion
    let bodyHtml = bodyTemplate
        .replace(/{{ customer_name }}/g, customerName)
        .replace(/{{ discount_code }}/g, discountCode)
        .replace(/\n/g, '<br>')

    // Insert the code in a nice box if it's not already formatted (simple heuristic)
    if (!bodyHtml.includes('code-box')) {
        bodyHtml = bodyHtml.replace(
            discountCode,
            `<div class="code-box">${discountCode}</div>`
        )
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .code-box { background-color: #ffffff; border: 2px dashed #2563eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; color: #2563eb; border-radius: 8px; }
        .footer { margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; font-size: 12px; color: #6c757d; text-align: center; }
        h1 { margin: 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ein Geschenk für Sie! 🎁</h1>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>Dies ist eine automatisch generierte E-Mail.</p>
        <p>&copy; ${new Date().getFullYear()} Ihr Kundenservice Team</p>
      </div>
    </body>
    </html>
  `

    return sendEmail({
        to: email,
        subject: subject,
        html: html
    })
}
