export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-nextauth'
import { verifyTwoFactorCode, disableTwoFactorForUser } from '@/lib/two-factor'

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

    // Verify the current code
    const isValid = await verifyTwoFactorCode(auth.user.id, code)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Disable 2FA for the user
    await disableTwoFactorForUser(auth.user.id)
    
    return NextResponse.json({
      enabled: false,
      backupCodes: []
    })
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
