'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <UserInfoUpdater />
      {children}
    </SessionProvider>
  )
}

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

function UserInfoUpdater() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/update-info', { method: 'POST' })
        .catch(err => console.error('Failed to update user info', err))
    }
  }, [session])

  return null
}
