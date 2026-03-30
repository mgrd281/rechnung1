export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { generateTwoFactorSecret, generateQRCodeUrl } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  try {
    // Mock user for testing
    const mockUser = {
      id: 1,
      email: 'test@example.com'
    }

    // Generate secret and QR code URL
    const secret = generateTwoFactorSecret()
    const qrCodeUrl = generateQRCodeUrl(mockUser.email, secret)
    
    return NextResponse.json({
      enabled: false,
      secret: secret,
      qrCodeUrl: qrCodeUrl,
      backupCodes: []
    })
  } catch (error) {
    console.error('Error enabling 2FA:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
