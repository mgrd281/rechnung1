export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { verifyTwoFactorCode, requiresTwoFactor } from '@/lib/two-factor'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// This would typically get user data from database
// For demo purposes, we'll simulate user lookup
async function getUserByEmail(email: string) {
  // In a real app, this would query your user database
  // For now, return a mock user
  return {
    id: 1,
    email: email,
    name: 'Test User',
    role: 'user'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if 2FA is required for this user
    const requires2FA = await requiresTwoFactor(user.id)
    if (!requires2FA) {
      return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 400 })
    }

    // Verify the 2FA code
    const isValid = await verifyTwoFactorCode(user.id, code)
    if (!isValid) {
      return NextResponse.json({ error: 'Ungültiger Authentifizierungscode' }, { status: 400 })
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      secret
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
