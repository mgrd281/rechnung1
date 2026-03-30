'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import QRCode from 'qrcode'

interface TwoFactorStatus {
  enabled: boolean
  backupCodes: string[]
  qrCodeUrl?: string
  secret?: string
}

export default function Test2FAPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
    backupCodes: []
  })
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isEnabling, setIsEnabling] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [step, setStep] = useState(1)
  const { showToast } = useToast()

  // Mock user for testing
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User'
  }

  const enableTwoFactor = async () => {
    setIsEnabling(true)
    try {
      const response = await fetch('/api/test-2fa/enable', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTwoFactorStatus(data)
        
        // Generate QR Code
        if (data.qrCodeUrl) {
          const qrImage = await QRCode.toDataURL(data.qrCodeUrl)
          setQrCodeImage(qrImage)
        }
        
        setShowSetup(true)
        setStep(1)
        showToast('2FA Setup gestartet', 'success')
      } else {
        showToast('Fehler beim Aktivieren der 2FA', 'error')
      }
    } catch (error) {
      console.error('Fehler beim Aktivieren der 2FA:', error)
      showToast('Fehler beim Aktivieren der 2FA', 'error')
    } finally {
      setIsEnabling(false)
    }
  }

  const verifyAndComplete = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Bitte geben Sie einen 6-stelligen Code ein', 'error')
      return
    }

    try {
      const response = await fetch('/api/test-2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      })

      if (response.ok) {
        const data = await response.json()
        setTwoFactorStatus({
          ...twoFactorStatus,
          enabled: data.enabled,
          backupCodes: data.backupCodes
        })
        setStep(3)
        showToast('Zwei-Faktor-Authentifizierung erfolgreich aktiviert!', 'success')
      } else {
        showToast('Ungültiger Verifizierungscode', 'error')
      }
    } catch (error) {
      console.error('Fehler bei der Verifizierung:', error)
      showToast('Netzwerkfehler', 'error')
    }
  }

  const downloadBackupCodes = () => {
    const codesText = twoFactorStatus.backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </Link>
          <Shield className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Zwei-Faktor-Authentifizierung (Test)
            </h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Test-Version der 2FA Funktionalität - funktioniert ohne Anmeldung
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {twoFactorStatus.enabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Die Zwei-Faktor-Authentifizierung ist derzeit{' '}
                  <span className={twoFactorStatus.enabled ? 'text-green-600' : 'text-red-600'}>
                    {twoFactorStatus.enabled ? 'aktiviert' : 'nicht aktiviert'}
                  </span>{' '}
                  für dieses Test-Konto.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Test-Benutzer: {mockUser.email}
                </p>
              </div>
              <div>
                {!twoFactorStatus.enabled ? (
                  <Button 
                    onClick={enableTwoFactor}
                    disabled={isEnabling}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isEnabling ? 'Wird aktiviert...' : 'Zwei-Faktor-Authentifizierung einrichten'}
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setTwoFactorStatus({ enabled: false, backupCodes: [] })
                      setShowSetup(false)
                      showToast('2FA deaktiviert', 'success')
                    }}
                  >
                    Deaktivieren
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Process */}
        {showSetup && !twoFactorStatus.enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Zwei-Faktor-Authentifizierung einrichten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Steps */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                  </div>
                  <span className={step >= 1 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                    Authentifizierungs-App aufrufen
                  </span>
                  
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                  </div>
                  <span className={step >= 2 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                    Code verifizieren
                  </span>
                  
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    {step > 3 ? <CheckCircle className="h-4 w-4" /> : '3'}
                  </div>
                  <span className={step >= 3 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                    Wiederherstellungscode
                  </span>
                </div>

                {/* Step 1: QR Code */}
                {step === 1 && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">1. Scanne diesen QR Code</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Klicke das + in deiner Authentifizierungs-App und scanne den QR Code mit deiner Kamera.
                      </p>
                      
                      {qrCodeImage && (
                        <div className="bg-white p-4 rounded-lg border inline-block">
                          <img src={qrCodeImage} alt="QR Code" className="w-48 h-48" />
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-4">
                        Test-Secret: {twoFactorStatus.secret}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Lade zuerst eine Authentifizierungs-App herunter
                      </h3>
                      
                      <div className="mb-6">
                        <h4 className="font-medium mb-3">Google Authenticator</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Für den Test können Sie auch einen beliebigen 6-stelligen Code eingeben.
                        </p>
                      </div>
                      
                      <Button onClick={() => setStep(2)} className="bg-purple-600 hover:bg-purple-700">
                        Nächster Schritt
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Verify Code */}
                {step === 2 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">2. Verifiziere den Authentifizierungscode</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Gib einen 6-stelligen Code ein (für den Test funktioniert jeder 6-stellige Code).
                    </p>
                    
                    <div className="max-w-xs">
                      <Label htmlFor="verification-code">6-stelliger Code</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-lg font-mono"
                      />
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button onClick={() => setStep(1)} variant="outline">
                        Zurück
                      </Button>
                      <Button onClick={verifyAndComplete} className="bg-purple-600 hover:bg-purple-700">
                        Bestätigen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Backup Codes */}
                {step === 3 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">3. Wiederherstellungscodes speichern</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Speichere diese Codes an einem sicheren Ort.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {twoFactorStatus.backupCodes.map((code, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button onClick={downloadBackupCodes} variant="outline">
                        Codes herunterladen
                      </Button>
                      <Button onClick={() => setShowSetup(false)} className="bg-green-600 hover:bg-green-700">
                        Fertig
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Codes (if 2FA is enabled) */}
        {twoFactorStatus.enabled && !showSetup && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Wiederherstellungscodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {twoFactorStatus.backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button onClick={downloadBackupCodes} variant="outline">
                Codes herunterladen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      
    </div>
  )
}
