import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerAuth } from '@/lib/auth-nextauth'
import { getUserTwoFactorStatus } from '@/lib/two-factor'

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth()

    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const twoFactorStatus = await getUserTwoFactorStatus(auth.user.id)

    return NextResponse.json(twoFactorStatus)
  } catch (error) {
    console.error('Error fetching 2FA status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
