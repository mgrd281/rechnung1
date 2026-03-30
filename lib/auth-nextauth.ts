import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export interface User {
  id: number
  email: string
  name: string
  role: string
}

export interface AuthResult {
  isAuthenticated: boolean
  user: User | null
  error?: string
}

// Updated auth function that supports both NextAuth and legacy JWT
export async function getServerAuth(request?: NextRequest): Promise<AuthResult> {
  try {
    // Try NextAuth session first
    const session = await auth()

    if (session?.user?.email) {
      // Convert NextAuth session to our User format
      const user: User = {
        id: 1, // In a real app, this would come from database
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        role: 'user'
      }

      return {
        isAuthenticated: true,
        user: user
      }
    }

    // Fallback to legacy JWT token system
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'No authentication found'
      }
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.verify(token, secret) as any

    // Check token expiration
    if (decoded.exp && decoded.exp <= Math.floor(Date.now() / 1000)) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'Token expired'
      }
    }

    const user: User = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'User',
      role: decoded.role
    }

    return {
      isAuthenticated: true,
      user: user
    }

  } catch (error) {
    console.error('Auth error:', error)
    return {
      isAuthenticated: false,
      user: null,
      error: 'Authentication failed'
    }
  }
}

// Helper function to get user ID from session
export async function getCurrentUserId(): Promise<number | null> {
  const auth = await getServerAuth()
  return auth.isAuthenticated ? auth.user?.id || null : null
}
