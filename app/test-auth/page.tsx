'use client'

import { useAuth } from '@/lib/auth-context'

export default function TestAuthPage() {
  const { user, isAuthenticated, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
        
        <div className="space-y-2">
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        </div>

        <div className="mt-6 space-y-2">
          <a href="/auth/login" className="block bg-blue-500 text-white px-4 py-2 rounded text-center">
            Login Page
          </a>
          <a href="/auth/register" className="block bg-green-500 text-white px-4 py-2 rounded text-center">
            Register Page
          </a>
          <a href="/dashboard" className="block bg-purple-500 text-white px-4 py-2 rounded text-center">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
