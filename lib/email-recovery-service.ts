import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
    }
})

export async function sendRecoveryEmail(to: string, discountCode: string, cartUrl: string) {
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@example.com'

    const mailOptions = {
        from: `"RechnungsProfi" <${fromEmail}>`,
        to: to,
        subject: 'Haben Sie etwas vergessen? 🛒 Hier ist 10% Rabatt!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Haben Sie etwas vergessen?</h2>
                <p style="font-size: 16px; color: #333;">
                    Hallo,
                </p>
                <p style="font-size: 16px; color: #333;">
                    Wir haben bemerkt, dass Sie Ihren Einkauf nicht abgeschlossen haben. Da wir Sie gerne als Kunden gewinnen möchten, schenken wir Ihnen einen <strong>10% Rabattcode</strong> für Ihre Bestellung!
                </p>
                
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #666; font-size: 14px;">Ihr Gutscheincode:</p>
                    <h1 style="margin: 10px 0; color: #2563eb; letter-spacing: 2px;">${discountCode}</h1>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${cartUrl}?discount=${discountCode}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Warenkorb wiederherstellen & 10% sparen
                    </a>
                </div>

                <p style="font-size: 12px; color: #999; text-align: center; margin-top: 40px;">
                    Dieser Code ist 48 Stunden gültig.
                </p>
            </div>
        `
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log(`[Email] Recovery email sent to ${to}`)
        return true
    } catch (error) {
        console.error('[Email] Failed to send recovery email:', error)
        throw error
    }
}
