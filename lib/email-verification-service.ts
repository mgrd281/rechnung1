/**
 * E-Mail-Verifizierung Service
 * Speziell für Verifizierungs-E-Mails mit Templates
 */

import { sendEmail } from './email-service'

// Generate verification email HTML template
export function generateVerificationEmailHTML(
  recipientName: string,
  verificationCode: string,
  expiresAt: Date,
  confirmationLink?: string
): string {
  const expiryTime = expiresAt.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const expiryDate = expiresAt.toLocaleDateString('de-DE')
  
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-Mail-Adresse bestätigen</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px; 
          text-align: center;
        }
        .verification-code {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #0369a1;
          font-family: 'Courier New', monospace;
          text-align: center;
        }
        .expiry-info {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
          text-align: left;
        }
        .expiry-info strong {
          color: #92400e;
        }
        .confirmation-link {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          display: inline-block;
          margin: 20px 0;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .confirmation-link:hover {
          transform: translateY(-2px);
          text-decoration: none;
          color: white;
        }
        .alternative-text {
          font-size: 14px;
          color: #6b7280;
          margin-top: 20px;
          padding: 15px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        .footer { 
          background-color: #f8fafc; 
          padding: 25px; 
          border-top: 1px solid #e5e7eb;
          font-size: 13px; 
          color: #6b7280; 
          text-align: center;
        }
        .footer ul { 
          list-style: none; 
          padding: 0; 
          margin: 15px 0 0 0; 
        }
        .footer li { 
          margin: 8px 0; 
        }
        .security-note {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
          text-align: left;
        }
        .security-note strong {
          color: #dc2626;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 E-Mail bestätigen</h1>
          <p>Willkommen bei RechnungsProfi</p>
        </div>
        
        <div class="content">
          <p>Hallo ${recipientName || 'liebe/r Nutzer/in'},</p>
          
          <p>vielen Dank für Ihre Registrierung bei <strong>RechnungsProfi</strong>!</p>
          
          <p>Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse mit dem folgenden Verifizierungscode:</p>
          
          <div class="verification-code">
            ${verificationCode}
          </div>
          
          <div class="expiry-info">
            <strong>⏰ Wichtig:</strong> Dieser Code ist nur bis <strong>${expiryDate} um ${expiryTime}</strong> gültig (10 Minuten).
          </div>
          
          ${confirmationLink ? `
            <p><strong>Alternativ können Sie auch auf diesen Link klicken:</strong></p>
            <a href="${confirmationLink}" class="confirmation-link">
              ✅ E-Mail-Adresse bestätigen
            </a>
            
            <div class="alternative-text">
              Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
              <code>${confirmationLink}</code>
            </div>
          ` : ''}
          
          <div class="security-note">
            <strong>🛡️ Sicherheitshinweis:</strong> Falls Sie sich nicht bei RechnungsProfi registriert haben, ignorieren Sie diese E-Mail. Ihr Konto wird nicht aktiviert.
          </div>
          
          <p>Nach der erfolgreichen Bestätigung können Sie sich mit Ihren Zugangsdaten anmelden und alle Funktionen nutzen.</p>
          
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          
          <p>Herzlich willkommen!<br>
          <strong>Ihr RechnungsProfi-Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Wichtige Hinweise:</strong></p>
          <ul>
            <li>🔒 Diese E-Mail wurde automatisch generiert</li>
            <li>⚠️ Teilen Sie den Verifizierungscode niemals mit anderen</li>
            <li>📞 Bei Problemen kontaktieren Sie unseren Support</li>
            <li>🕐 Der Code läuft automatisch nach 10 Minuten ab</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate verification email plain text
export function generateVerificationEmailText(
  recipientName: string,
  verificationCode: string,
  expiresAt: Date,
  confirmationLink?: string
): string {
  const expiryTime = expiresAt.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const expiryDate = expiresAt.toLocaleDateString('de-DE')
  
  return `
E-Mail-Adresse bestätigen - RechnungsProfi

Hallo ${recipientName || 'liebe/r Nutzer/in'},

vielen Dank für Ihre Registrierung bei RechnungsProfi!

Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse mit dem folgenden Verifizierungscode:

VERIFIZIERUNGSCODE: ${verificationCode}

WICHTIG: Dieser Code ist nur bis ${expiryDate} um ${expiryTime} gültig (10 Minuten).

${confirmationLink ? `
Alternativ können Sie auch auf diesen Link klicken:
${confirmationLink}
` : ''}

SICHERHEITSHINWEIS: Falls Sie sich nicht bei RechnungsProfi registriert haben, ignorieren Sie diese E-Mail. Ihr Konto wird nicht aktiviert.

Nach der erfolgreichen Bestätigung können Sie sich mit Ihren Zugangsdaten anmelden und alle Funktionen nutzen.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Herzlich willkommen!
Ihr RechnungsProfi-Team

---
Wichtige Hinweise:
• Diese E-Mail wurde automatisch generiert
• Teilen Sie den Verifizierungscode niemals mit anderen
• Bei Problemen kontaktieren Sie unseren Support
• Der Code läuft automatisch nach 10 Minuten ab
  `
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  recipientName: string,
  verificationCode: string,
  expiresAt: Date,
  confirmationLink?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('📧 Sending verification email to:', email)
    console.log('🔐 Verification code:', verificationCode)
    console.log('⏰ Expires at:', expiresAt.toISOString())
    
    const subject = '🔐 E-Mail-Adresse bestätigen - RechnungsProfi'
    const htmlContent = generateVerificationEmailHTML(recipientName, verificationCode, expiresAt, confirmationLink)
    const textContent = generateVerificationEmailText(recipientName, verificationCode, expiresAt, confirmationLink)
    
    const result = await sendEmail({
      to: email,
      subject,
      html: htmlContent
    })
    
    if (result.success) {
      console.log('✅ Verification email sent successfully!')
      console.log('📝 Message ID:', result.messageId)
    } else {
      console.error('❌ Failed to send verification email:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
