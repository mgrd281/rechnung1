'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (userData: User) => void
  logout: () => void
  loading: boolean
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName?: string
  isAdmin?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Emergency fallback to prevent infinite loading
  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      if (loading) {
        console.log('🚨 Emergency: Forcing loading to false after 5 seconds')
        setLoading(false)
      }
    }, 5000)

    return () => clearTimeout(emergencyTimer)
  }, [])

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const checkAuthStatus = () => {
      try {
        console.log('🔍 AuthContext: Checking authentication status...')
        
        // Check if localStorage is available
        if (typeof window === 'undefined' || !window.localStorage) {
          console.log('⚠️ AuthContext: localStorage not available')
          setLoading(false)
          return
        }

        const savedAuth = localStorage.getItem('rechnungsprofi_auth')
        if (savedAuth && savedAuth !== 'undefined' && savedAuth !== 'null') {
          const authData = JSON.parse(savedAuth)
          if (authData && authData.isAuthenticated && authData.user && authData.user.email) {
            console.log('✅ AuthContext: Found valid saved authentication')
            setIsAuthenticated(true)
            setUser(authData.user)
          } else {
            console.log('❌ AuthContext: Invalid saved authentication data')
            localStorage.removeItem('rechnungsprofi_auth')
          }
        } else {
          console.log('ℹ️ AuthContext: No saved authentication found')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking auth status:', error)
        try {
          localStorage.removeItem('rechnungsprofi_auth')
        } catch (cleanupError) {
          console.error('❌ AuthContext: Error cleaning up localStorage:', cleanupError)
        }
      } finally {
        console.log('✅ AuthContext: Authentication check completed')
        setLoading(false)
      }
    }

    // Add a small delay to prevent flash
    const timer = setTimeout(checkAuthStatus, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const login = (userData: User) => {
    console.log('🔐 AuthContext: User login attempt', userData)
    
    // Validate user data
    if (!userData || !userData.email || !userData.id) {
      console.error('❌ AuthContext: Invalid user data provided')
      return
    }

    try {
      setIsAuthenticated(true)
      setUser(userData)
      
      // Save to localStorage with error handling
      if (typeof window !== 'undefined' && window.localStorage) {
        const authData = {
          isAuthenticated: true,
          user: userData,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
        localStorage.setItem('rechnungsprofi_auth', JSON.stringify(authData))
        console.log('✅ AuthContext: User logged in successfully and saved to localStorage')
      } else {
        console.log('✅ AuthContext: User logged in successfully (localStorage not available)')
      }
    } catch (error) {
      console.error('❌ AuthContext: Error during login:', error)
      // Still set the state even if localStorage fails
      setIsAuthenticated(true)
      setUser(userData)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('rechnungsprofi_auth')
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
