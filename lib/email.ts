import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Additional settings to help with some providers
  tls: {
    rejectUnauthorized: false // Sometimes needed for self-signed certs or specific provider issues
  },
  debug: true, // Enable debug output
  logger: true // Log information to console
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Connection Ready');
  }
});

export async function sendVerificationEmail(email: string, token: string) {
  // Prioritize NEXTAUTH_URL, then VERCEL_URL (add https), then localhost
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

  console.log(`📧 Attempting to send email to ${email} using host: ${process.env.SMTP_HOST} port: ${process.env.SMTP_PORT}`);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"RechnungsProfi" <noreply@rechnungsprofi.de>',
      to: email,
      subject: 'Bestätigen Sie Ihre E-Mail-Adresse',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1e40af;">Willkommen bei RechnungsProfi!</h2>
          <p>Vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihren Account zu aktivieren und vollen Zugriff zu erhalten.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">E-Mail bestätigen</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Wenn der Button nicht funktioniert, kopieren Sie bitte diesen Link in Ihren Browser:</p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
}
