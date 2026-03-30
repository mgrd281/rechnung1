'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function AccessGatePage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/gate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // Redirect to the intended page or auth/signin
                const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/auth/signin'
                router.push(redirectTo)
                router.refresh()
            } else {
                setError(data.error || 'Falsches Passwort')
                setPassword('')
            }
        } catch (error) {
            console.error('Access gate error:', error)
            setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-[10px] opacity-50">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>
            </div>

            {/* Main Card */}
            <Card className="w-full max-w-md relative z-10 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center pb-8">
                    {/* Icon */}
                    <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <Shield className="h-10 w-10 text-white" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Geschützter Bereich
                        </CardTitle>
                        <CardDescription className="text-base text-gray-600">
                            Bitte geben Sie das Zugangspasswort ein
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Password Input */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 font-medium">
                                Passwort
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-xl"
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                            disabled={isLoading || !password}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Überprüfe...
                                </div>
                            ) : (
                                'Weiter'
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Dieser Bereich ist passwortgeschützt
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    )
}
