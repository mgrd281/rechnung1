'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, UserPlus, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    acceptTerms: false,
    acceptNewsletter: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validierung
    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      setLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError('Bitte akzeptieren Sie die Nutzungsbedingungen.')
      setLoading(false)
      return
    }

    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus.')
      }

      if (!formData.email.includes('@')) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      }

      if (formData.password.length < 6) {
        throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein.')
      }

      // Call real registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          companyName: formData.companyName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen.')
      }

      // Success! Redirect to login with success message
      router.push('/auth/signin?verified=pending')

    } catch (error: any) {
      console.error('❌ Registration error:', error)
      setError(error.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleGoogleRegister = () => {
    signIn('google', { callbackUrl: '/' })
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

        {/* Register Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Konto erstellen
            </CardTitle>
            <CardDescription className="text-gray-600">
              Registrieren Sie sich für RechnungsProfi
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Registration Button */}
            <Button
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-5"
              onClick={handleGoogleRegister}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Mit Google registrieren
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Oder mit E-Mail
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    Vorname
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Max"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Nachname
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Mustermann"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Firmenname (optional)
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Mustermann GmbH"
                />
              </div>

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
                  placeholder="max@mustermann.de"
                  required
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
                    placeholder="Mindestens 8 Zeichen"
                    required
                    className="pr-10"
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

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Passwort wiederholen"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Ich akzeptiere die{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                      Nutzungsbedingungen
                    </Link>{' '}
                    und{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                      Datenschutzerklärung
                    </Link>
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptNewsletter"
                    checked={formData.acceptNewsletter}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Ich möchte den Newsletter mit Updates und Tipps erhalten (optional)
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Konto wird erstellt...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Konto erstellen
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Bereits ein Konto?{' '}
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500 font-medium">
                  Jetzt anmelden
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Ihre Vorteile:</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center">
              <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              Professionelle Rechnungen nach deutschem Recht
            </div>
            <div className="flex items-center">
              <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              Automatische Shopify-Integration
            </div>
            <div className="flex items-center">
              <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              DSGVO-konforme Datenverwaltung
            </div>
            <div className="flex items-center">
              <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              Kostenlose 30-Tage-Testphase
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
