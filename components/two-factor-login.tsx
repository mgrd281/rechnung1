'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Smartphone, CircleAlert } from 'lucide-react'

interface TwoFactorLoginProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export function TwoFactorLogin({ email, onSuccess, onBack }: TwoFactorLoginProps) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code || code.length < 6) {
      setError('Bitte geben Sie einen gültigen Code ein')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: code.replace(/\s/g, '') // Remove spaces
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Ungültiger Code')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Zwei-Faktor-Authentifizierung</CardTitle>
        <p className="text-gray-600 text-sm">
          Geben Sie den 6-stelligen Code aus Ihrer Authentifizierungs-App ein
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="auth-code">
              {useBackupCode ? 'Wiederherstellungscode' : 'Authentifizierungscode'}
            </Label>
            <div className="relative">
              <Input
                id="auth-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={useBackupCode ? "ABCD1234" : "123 456"}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={useBackupCode ? 8 : 7} // 6 digits + space
                autoComplete="one-time-code"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Smartphone className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            {!useBackupCode && (
              <p className="text-xs text-gray-500 mt-1">
                Geben Sie den Code aus Google Authenticator oder einer ähnlichen App ein
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <CircleAlert className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying || !code}
            >
              {isVerifying ? 'Wird überprüft...' : 'Anmelden'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setUseBackupCode(!useBackupCode)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {useBackupCode 
                  ? 'Authentifizierungs-App verwenden' 
                  : 'Wiederherstellungscode verwenden'
                }
              </button>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={onBack}
            >
              Zurück zur Anmeldung
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Probleme beim Anmelden?</p>
              <ul className="text-xs space-y-1">
                <li>• Stellen Sie sicher, dass die Uhrzeit auf Ihrem Gerät korrekt ist</li>
                <li>• Verwenden Sie den aktuellsten Code aus Ihrer App</li>
                <li>• Bei Problemen können Sie einen Wiederherstellungscode verwenden</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
