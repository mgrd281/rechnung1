export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { generateBackupCodes } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    // For testing, accept any 6-digit code
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      // Generate backup codes
      const backupCodes = generateBackupCodes()
      
      return NextResponse.json({
        enabled: true,
        backupCodes: backupCodes
      })
    } else {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
