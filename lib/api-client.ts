import { useAuth } from '@/hooks/use-auth-compat'
import { useCallback } from 'react'

// Helper function to create authenticated API requests
export function createAuthenticatedRequest(user: any) {
  // Safe Base64 encode to handle special characters (umlauts, emojis, etc.)
  const userInfoStr = JSON.stringify(user)
  const userInfoBase64 = btoa(encodeURIComponent(userInfoStr).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    }))

  return {
    headers: {
      // 'Content-Type': 'application/json', // REMOVED: Let fetch handle this based on body
      'x-user-info': userInfoBase64
    }
  }
}

// Custom hook for authenticated API calls
export function useAuthenticatedFetch() {
  const { user } = useAuth()

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!user) {
      console.warn('⚠️ useAuthenticatedFetch called without authenticated user')
      // For login/register pages, just use regular fetch
      return fetch(url, options)
    }

    const authHeaders = createAuthenticatedRequest(user)

    // Determine Content-Type
    const headers: Record<string, string> = {
      ...authHeaders.headers,
      ...(options.headers as Record<string, string>)
    }

    // Auto-set Content-Type to application/json if not set and body is not FormData
    if (!headers['Content-Type'] &&
      !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const mergedOptions: RequestInit = {
      ...options,
      credentials: 'include', // Ensure cookies are sent
      headers
    }

    return fetch(url, mergedOptions)
  }, [user])

  return authenticatedFetch
}

// Utility function for non-hook contexts
export function createAuthenticatedFetchOptions(user: any, options: RequestInit = {}): RequestInit {
  if (!user) {
    throw new Error('User not authenticated')
  }

  const authHeaders = createAuthenticatedRequest(user)

  return {
    ...options,
    headers: {
      ...authHeaders.headers,
      ...options.headers
    }
  }
}
