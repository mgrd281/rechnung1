export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-nextauth'
import { initiateTwoFactorSetup } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initiate 2FA setup process
    const setupData = await initiateTwoFactorSetup(auth.user.id, auth.user.email)
    
    return NextResponse.json(setupData)
  } catch (error) {
    console.error('Error enabling 2FA:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
