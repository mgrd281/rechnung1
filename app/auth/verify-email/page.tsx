'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Clock, RefreshCw, CheckCircle, XCircle, ArrowLeft, Shield } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL-Parameter
  const emailParam = searchParams.get('email') || ''
  const codeParam = searchParams.get('code') || ''

  // State
  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState(codeParam)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verified, setVerified] = useState(false)

  // Countdown und Rate Limiting
  const [countdown, setCountdown] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [maxAttempts] = useState(5)
  const [blocked, setBlocked] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState(5)

  // Refs
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const countdownInterval = useRef<NodeJS.Timeout | null>(null)
  const resendInterval = useRef<NodeJS.Timeout | null>(null)

  // Auto-Verifizierung wenn Code in URL
  useEffect(() => {
    if (emailParam && codeParam && codeParam.length === 6) {
      handleVerify(codeParam, emailParam)
    }
  }, [emailParam, codeParam])

  // Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
      }
    }
  }, [countdown])

  // Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendInterval.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            if (resendInterval.current) {
              clearInterval(resendInterval.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (resendInterval.current) {
        clearInterval(resendInterval.current)
      }
    }
  }, [resendCooldown])

  // Code Input Handler
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Nur Zahlen

    const newCode = code.split('')
    newCode[index] = value
    const updatedCode = newCode.join('')
    setCode(updatedCode)

    // Auto-focus nächstes Feld
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }

    // Auto-verify wenn 6 Stellen
    if (updatedCode.length === 6 && email) {
      handleVerify(updatedCode, email)
    }
  }

  // Backspace Handler
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  // Paste Handler
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setCode(pastedData)
      if (email) {
        handleVerify(pastedData, email)
      }
    }
  }

  // Verifizierung
  const handleVerify = async (verificationCode?: string, verificationEmail?: string) => {
    const codeToVerify = verificationCode || code
    const emailToVerify = verificationEmail || email

    if (!emailToVerify || !emailToVerify.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }

    if (!codeToVerify || codeToVerify.length !== 6) {
      setError('Bitte geben Sie den vollständigen 6-stelligen Code ein.')
      return
    }

    if (attempts >= maxAttempts) {
      setError('Maximale Anzahl Versuche erreicht. Bitte fordern Sie einen neuen Code an.')
      setBlocked(true)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/email-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToVerify,
          code: codeToVerify
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('E-Mail erfolgreich verifiziert! Sie werden weitergeleitet...')
        setVerified(true)

        // Weiterleitung nach 2 Sekunden
        setTimeout(() => {
          router.push('/auth/login?verified=true')
        }, 2000)
      } else {
        setAttempts(prev => prev + 1)
        setError(data.error || 'Verifizierung fehlgeschlagen')

        if (data.remainingAttempts !== undefined) {
          setAttemptsRemaining(data.remainingAttempts)

          if (data.remainingAttempts <= 0) {
            setBlocked(true)
          }
        }

        // Code zurücksetzen bei Fehler
        setCode('')
        codeInputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  // Code erneut senden
  const handleResendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }

    if (resendCooldown > 0) {
      setError(`Bitte warten Sie noch ${resendCooldown} Sekunden.`)
      return
    }

    setResending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/email-verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: 'Nutzer' // Fallback name
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Neuer Verifizierungscode wurde gesendet!')
        setCode('')
        setAttempts(0)
        setBlocked(false)
        setAttemptsRemaining(5)

        // Countdown starten (10 Minuten)
        setCountdown(10 * 60)

        // Resend Cooldown (60 Sekunden)
        setResendCooldown(60)

        // Focus erstes Input
        codeInputRefs.current[0]?.focus()
      } else {
        setError(data.error || 'Code konnte nicht gesendet werden')

        if (data.cooldownSeconds) {
          setResendCooldown(data.cooldownSeconds)
        }
      }
    } catch (error) {
      console.error('Resend error:', error)
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setResending(false)
    }
  }

  // Zeit formatieren
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/auth/register">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Registrierung
            </Button>
          </Link>
        </div>

        {/* Verification Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-xl ${verified ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                {verified ? (
                  <CheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <Mail className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <CardTitle className={`text-2xl font-bold ${verified ? 'text-green-600' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
              {verified ? 'Verifiziert!' : 'E-Mail bestätigen'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {verified
                ? 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt'
                : 'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!verified && (
              <>
                {/* E-Mail Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    E-Mail-Adresse
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ihre@email.de"
                    disabled={loading || verified}
                    className="text-center"
                  />
                </div>

                {/* Code Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Verifizierungscode
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          codeInputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={code[index] || ''}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={loading || blocked || verified}
                        className="w-12 h-12 text-center text-lg font-bold"
                      />
                    ))}
                  </div>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                    <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {success}
                  </div>
                )}

                {/* Countdown */}
                {countdown > 0 && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Code läuft ab in: <strong className="ml-1">{formatTime(countdown)}</strong>
                  </div>
                )}

                {/* Attempts Info */}
                {!blocked && attemptsRemaining < 5 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Noch <strong>{attemptsRemaining}</strong> Versuche übrig
                  </div>
                )}

                {/* Blocked Warning */}
                {blocked && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an.
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleVerify()}
                    disabled={loading || !email || code.length !== 6 || blocked || verified}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird verifiziert...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Code bestätigen
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={resending || !email || resendCooldown > 0}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Wird gesendet...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Erneut senden in {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Code erneut senden
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {verified && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-lg">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">E-Mail erfolgreich bestätigt!</p>
                  <p className="text-sm mt-2">Sie können sich jetzt anmelden.</p>
                </div>

                <Button
                  onClick={() => router.push('/auth/login?verified=true')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Zur Anmeldung
                </Button>
              </div>
            )}

            {/* Help Text */}
            {!verified && (
              <div className="text-center text-sm text-gray-600">
                <p>Keine E-Mail erhalten?</p>
                <p className="mt-1">Prüfen Sie Ihren Spam-Ordner oder fordern Sie einen neuen Code an.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        {!verified && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Sicherheitshinweise:
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Der Code ist 10 Minuten gültig</p>
              <p>• Maximal 5 Eingabeversuche pro Code</p>
              <p>• Maximal 5 E-Mails pro Stunde</p>
              <p>• 60 Sekunden Wartezeit zwischen Anfragen</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
