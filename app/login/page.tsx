'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Lock } from 'lucide-react'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'

function LoginForm() {
    const router = useRouter()
    const { navigate } = useSafeNavigation()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const redirect = searchParams.get('redirect') || '/dashboard'
    const sessionExpired = searchParams.get('session') === 'expired'
    const invalidToken = searchParams.get('error') === 'invalid-token'

    useEffect(() => {
        if (sessionExpired) {
            setError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.')
        } else if (invalidToken) {
            setError('Ungültiges Authentifizierungstoken. Bitte melden Sie sich erneut an.')
        }
    }, [sessionExpired, invalidToken])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Login fehlgeschlagen')
            }

            // Successful login - cookies are set by API
            console.log('✅ Login successful, redirecting to:', redirect)

            // Small delay to ensure cookies are set
            await new Promise(resolve => setTimeout(resolve, 100))

            // Redirect to the original page or default to /invoices
            window.location.href = redirect

        } catch (error: any) {
            console.error('❌ Login error:', error)
            setError(error.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Anmelden</CardTitle>
                    <CardDescription className="text-center">
                        Melden Sie sich an, um auf Ihr Konto zuzugreifen
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {redirect && !sessionExpired && !invalidToken && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                                <p className="text-sm">
                                    Bitte melden Sie sich an, um fortzufahren.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                E-Mail-Adresse
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ihre.email@beispiel.de"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                autoFocus
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Passwort
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="h-11"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Anmelden...
                                </>
                            ) : (
                                'Anmelden'
                            )}
                        </Button>

                        <div className="text-center text-sm text-gray-600">
                            <a href="/landing" className="text-blue-600 hover:underline">
                                Zurück zur Startseite
                            </a>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            {/* Development info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-xs">
                    <p className="font-semibold mb-2">Development Info:</p>
                    <p>Redirect to: {redirect}</p>
                    <p className="mt-2 text-gray-400">
                        Use your database credentials or test with demo accounts
                    </p>
                </div>
            )}
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
