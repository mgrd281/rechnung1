'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-compat'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔐 Login attempt with:', { email: formData.email, password: formData.password })

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error('Bitte füllen Sie alle Felder aus.')
      }

      if (!formData.email.includes('@')) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      }

      if (formData.password.length < 4) {
        throw new Error('Das Passwort muss mindestens 4 Zeichen lang sein.')
      }

      // 1. Check if email is verified (skip for specific dev/demo emails if needed)
      // Note: In a production app, this should be handled by the backend/NextAuth
      console.log('🔍 Checking email verification status for:', formData.email)

      try {
        const verificationResponse = await fetch(`/api/auth/email-verification/status?email=${encodeURIComponent(formData.email)}`)
        const verificationData = await verificationResponse.json()

        if (verificationData.success && !verificationData.isVerified) {
          // Check if it's a known admin account that can bypass verification (for recovery)
          const bypassEmails = ['mgrdegh@web.de', 'mkarina321@']
          if (!bypassEmails.includes(formData.email.toLowerCase())) {
            console.log('❌ Email not verified, redirecting to verification page')
            setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.')

            // Redirect to verification page after 2 seconds
            setTimeout(() => {
              router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
            }, 2000)
            return
          }
          console.log('🎭 Bypass email verification for admin/known account')
        }
      } catch (verificationError) {
        console.warn('⚠️ Could not check email verification status:', verificationError)
        // Continue with login if verification check fails (fallback)
      }

      // 2. Login with NextAuth
      console.log('🔐 Attempting sign-in with NextAuth...')
      const result = await login({
        email: formData.email,
        password: formData.password
      })

      if (!result.success) {
        setError('Ungültige E-Mail-Adresse oder Passwort.')
        return
      }

      console.log('✅ Login successful, redirecting to dashboard')
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Willkommen zurück
            </CardTitle>
            <CardDescription className="text-gray-600">
              Melden Sie sich in Ihrem RechnungsProfi-Konto an
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-Mail-Adresse
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ihre@email.de"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Passwort
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Ihr Passwort"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Angemeldet bleiben</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Passwort vergessen?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Anmelden...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Anmelden
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Noch kein Konto?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  Jetzt registrieren
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Trust indicators */}
        <div className="mt-6 text-center">
          <div className="flex justify-center items-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              DSGVO-konform
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              SSL-verschlüsselt
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Made in Germany
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
