'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getProviders, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider>>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const errorParam = searchParams.get('error')
  const verifiedParam = searchParams.get('verified')

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      if (res) {
        setProviders(res)
      }
    }
    fetchProviders()

    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }
    checkSession()

    // Handle messages from URL params
    if (verifiedParam === 'true') {
      setSuccess('E-Mail erfolgreich bestätigt! Sie können sich jetzt anmelden.')
    } else if (verifiedParam === 'pending') {
      setSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen.')
    }

    if (errorParam) {
      switch (errorParam) {
        case 'OAuthSignin':
          setError('Fehler beim OAuth-Anmeldeprozess')
          break
        case 'OAuthCallback':
          setError('Fehler beim OAuth-Callback')
          break
        case 'OAuthCreateAccount':
          setError('Fehler beim Erstellen des OAuth-Kontos')
          break
        case 'EmailCreateAccount':
          setError('Fehler beim Erstellen des E-Mail-Kontos')
          break
        case 'Callback':
          setError('Fehler beim Callback')
          break
        case 'OAuthAccountNotLinked':
          setError('E-Mail-Adresse ist bereits mit einem anderen Konto verknüpft')
          break
        case 'EmailSignin':
          setError('Fehler beim E-Mail-Versand')
          break
        case 'CredentialsSignin':
          setError('Ungültige Anmeldedaten')
          break
        case 'SessionRequired':
          setError('Anmeldung erforderlich')
          break
        default:
          setError('Ein unbekannter Fehler ist aufgetreten')
      }
    }
  }, [router, callbackUrl, errorParam, verifiedParam])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        setError('Ungültige Anmeldedaten')
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSignIn = async (providerId: string) => {
    setIsLoading(true)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error('Provider sign in error:', error)
      setError('Fehler bei der Anmeldung')
      setIsLoading(false)
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )
      case 'apple':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getProviderButtonStyle = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
      case 'apple':
        return 'bg-black hover:bg-gray-800 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bei Ihrem Konto anmelden
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Oder{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              erstellen Sie ein neues Konto
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Anmelden</CardTitle>
            <CardDescription>
              Wählen Sie Ihre bevorzugte Anmeldemethode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">{success}</span>
              </div>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              {Object.values(providers)
                .filter(provider => provider.id !== 'credentials')
                .map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    className={`w-full ${getProviderButtonStyle(provider.id)}`}
                    onClick={() => handleProviderSignIn(provider.id)}
                    disabled={isLoading}
                  >
                    {getProviderIcon(provider.id)}
                    <span className="ml-2">
                      Mit {provider.name} anmelden
                    </span>
                  </Button>
                ))}
            </div>

            {/* Separator */}
            {Object.keys(providers).length > 1 && (
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
            )}

            {/* Credentials Form */}
            {providers.credentials && (
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="pl-10"
                      placeholder="ihre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="pl-10 pr-10"
                      placeholder="Ihr Passwort"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Passwort vergessen?
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>
            Durch die Anmeldung stimmen Sie unseren{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Nutzungsbedingungen
            </Link>{' '}
            und der{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Datenschutzerklärung
            </Link>{' '}
            zu.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden...</div>}>
      <SignInContent />
    </Suspense>
  )
}
