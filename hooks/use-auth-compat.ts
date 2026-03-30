'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

// Compatibility hook that mimics the old useAuth interface
export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAuthenticated = !!session
  const loading = status === 'loading'

  // Mock user object that matches the old interface
  const user = useMemo(() => {
    if (!session) return null
    return {
      id: (session.user as any)?.id || 1,
      email: session.user?.email || '',
      name: session.user?.name || session.user?.email?.split('@')[0] || 'User',
      role: 'user',
      firstName: session.user?.name?.split(' ')[0] || '',
      lastName: session.user?.name?.split(' ')[1] || '',
      // Check for admin email
      isAdmin: ['mgrdegh@web.de', 'Mkarina321@'].includes((session.user?.email || '').toLowerCase())
    }
  }, [session])

  // Login function that redirects to NextAuth signin
  const login = async (credentials?: { email: string; password: string }) => {
    if (credentials) {
      // Try credentials login
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/dashboard')
        return { success: true }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    } else {
      // Redirect to signin page
      signIn()
      return { success: true }
    }
  }

  // Logout function
  const logout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  // Register function (for compatibility)
  const register = async (userData: any) => {
    // In a real app, this would create a new user account
    // For now, just redirect to signin
    router.push('/auth/signin')
    return { success: true }
  }

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register
  }
}
