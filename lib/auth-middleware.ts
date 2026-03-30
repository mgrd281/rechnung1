import { NextRequest } from 'next/server'

// Admin emails that can see all data
const ADMIN_EMAILS = [
  'mgrdegh@web.de',
  'Mkarina321@'
]

export interface AuthenticatedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName?: string
  isAdmin?: boolean
}

export function getUserFromRequest(request: NextRequest): AuthenticatedUser | null {
  try {
    // Get user info from headers (sent by client)
    const userHeader = request.headers.get('x-user-info')

    if (!userHeader) {
      console.log('❌ No user info in headers')
      return null
    }

    let userData
    try {
      // Try to parse as JSON first (backward compatibility)
      userData = JSON.parse(userHeader)
    } catch (e) {
      // If failed, try to decode from Base64 (Safe decode)
      try {
        const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(userHeader), function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        userData = JSON.parse(jsonStr)
      } catch (err) {
        console.error('❌ Failed to decode user info header:', err)
        return null
      }
    }

    // Validate user data
    if (!userData || !userData.id || !userData.email) {
      console.log('❌ Invalid user data in headers')
      return null
    }

    // Check if user is admin
    const isAdmin = ADMIN_EMAILS.includes(userData.email.toLowerCase())
    const userWithAdmin = { ...userData, isAdmin }

    console.log('✅ User authenticated:', userData.email, isAdmin ? '(ADMIN)' : '(USER)')
    return userWithAdmin
  } catch (error) {
    console.error('❌ Error parsing user info from headers:', error)
    return null
  }
}

export function requireAuth(request: NextRequest): { user: AuthenticatedUser } | { error: Response } {
  const user = getUserFromRequest(request)

  if (!user) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          message: 'Sie müssen angemeldet sein, um diese Aktion auszuführen.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return { user }
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}

export function shouldShowAllData(user: AuthenticatedUser): boolean {
  return isAdmin(user)
}
