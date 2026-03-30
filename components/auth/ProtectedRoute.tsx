'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClientAuth, User } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  fallback?: React.ReactNode
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallback
}: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const authResult = getClientAuth()

      setIsAuthenticated(authResult.isAuthenticated)
      setUser(authResult.user)

      if (!authResult.isAuthenticated) {
        // Weiterleitung zur Login-Seite
        router.push('/landing')
        return
      }

      // Berechtigungen prüfen, falls erforderlich
      if (requiredRole && authResult.user) {
        const roleHierarchy = {
          'admin': 3,
          'manager': 2,
          'user': 1
        }

        const userLevel = roleHierarchy[authResult.user.role as keyof typeof roleHierarchy] || 0
        const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

        if (userLevel < requiredLevel) {
          // Benutzer hat nicht die erforderlichen Berechtigungen
          router.push('/dashboard') // Weiterleitung zur Hauptseite
          return
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, requiredRole])

  // Ladebildschirm anzeigen
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Berechtigungen werden überprüft...</p>
          </div>
        </div>
      )
    )
  }

  // Geschützten Inhalt anzeigen
  if (isAuthenticated && user) {
    return <>{children}</>
  }

  // Falls keine Authentifizierung vorhanden ist (passiert normalerweise nicht wegen Weiterleitung)
  return null
}

// Komponente nur zur Berechtigungsprüfung (ohne Weiterleitung)
interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: string
  fallback?: React.ReactNode
  user?: User | null
}

export function RoleGuard({ children, requiredRole, fallback, user }: RoleGuardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null)

  useEffect(() => {
    if (!user) {
      const authResult = getClientAuth()
      setCurrentUser(authResult.user)
    }
  }, [user])

  if (!currentUser) {
    return fallback || null
  }

  const roleHierarchy = {
    'admin': 3,
    'manager': 2,
    'user': 1
  }

  const userLevel = roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  if (userLevel >= requiredLevel) {
    return <>{children}</>
  }

  return fallback || null
}
