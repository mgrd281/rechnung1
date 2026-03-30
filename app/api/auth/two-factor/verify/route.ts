export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-nextauth'
import { verifyTwoFactorCode, generateBackupCodes, enableTwoFactorForUser } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()
    
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    // Verify the code against the temporary secret
    // This would typically retrieve the temporary secret from database
    const isValid = await verifyTwoFactorCode(auth.user.id, code)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes()
    
    // Enable 2FA for the user
    await enableTwoFactorForUser(auth.user.id, backupCodes)
    
    return NextResponse.json({
      enabled: true,
      backupCodes: backupCodes
    })
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
