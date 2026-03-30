'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function SimpleLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 Simple login attempt:', { email, password })

      // Demo credentials
      const validCredentials = [
        { email: 'demo@rechnungsprofi.de', password: 'demo123' },
        { email: 'test@example.com', password: 'test123' },
        { email: 'max@mustermann.de', password: 'max123' },
        { email: 'mgrdegh@web.de', password: 'admin123' },
        { email: 'Mkarina321@', password: 'admin123' }
      ]

      const isValid = validCredentials.some(
        cred => cred.email === email && cred.password === password
      )

      if (!isValid) {
        throw new Error('Ungültige E-Mail-Adresse oder Passwort.')
      }

      // Check if admin
      const adminEmails = ['mgrdegh@web.de', 'Mkarina321@']
      const isAdmin = adminEmails.includes(email.toLowerCase())

      const userData = {
        id: '1',
        email: email,
        firstName: isAdmin ? 'Admin' : 'Test',
        lastName: isAdmin ? 'User' : 'User',
        companyName: isAdmin ? 'Admin Company' : 'Test Company',
        isAdmin: isAdmin
      }

      console.log('✅ Login successful, user data:', userData)
      
      login(userData)
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('❌ Login error:', error)
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Simple Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">Test Credentials:</p>
          <ul className="space-y-1">
            <li>demo@rechnungsprofi.de / demo123</li>
            <li>test@example.com / test123</li>
            <li>max@mustermann.de / max123</li>
            <li>mgrdegh@web.de / admin123 (ADMIN)</li>
            <li>Mkarina321@ / admin123 (ADMIN)</li>
          </ul>
        </div>

        <div className="mt-4 space-y-2">
          <a href="/auth/login" className="block text-center text-blue-600 hover:underline">
            Go to Original Login
          </a>
          <a href="/test-auth" className="block text-center text-green-600 hover:underline">
            Test Auth Status
          </a>
          <a href="/dashboard" className="block text-center text-purple-600 hover:underline">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
