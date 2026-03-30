'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function TwoFactorAuthPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
    backupCodes: []
  })
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isEnabling, setIsEnabling] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [step, setStep] = useState(1) // 1: QR Code, 2: Verify, 3: Backup Codes
  const { showToast } = useToast()

  useEffect(() => {
    fetchTwoFactorStatus()
  }, [])

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/auth/two-factor/status')
      if (response.ok) {
        const data = await response.json()
        setTwoFactorStatus(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden des 2FA-Status:', error)
    }
  }

  const enableTwoFactor = async () => {
    setIsEnabling(true)
    try {
      const response = await fetch('/api/auth/two-factor/enable', {
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
      } else {
        showToast('Fehler beim Aktivieren der 2FA', 'error')
      }
    } catch (error) {
      console.error('Fehler beim Aktivieren der 2FA:', error)
      showToast('Netzwerkfehler', 'error')
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
      const response = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      })

      if (response.ok) {
        const data = await response.json()
        setTwoFactorStatus(data)
        setStep(3) // Show backup codes
        showToast('Zwei-Faktor-Authentifizierung erfolgreich aktiviert!', 'success')
      } else {
        showToast('Ungültiger Verifizierungscode', 'error')
      }
    } catch (error) {
      console.error('Fehler bei der Verifizierung:', error)
      showToast('Netzwerkfehler', 'error')
    }
  }

  const disableTwoFactor = async () => {
    setIsDisabling(true)
    try {
      const response = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      })

      if (response.ok) {
        setTwoFactorStatus({ enabled: false, backupCodes: [] })
        setShowSetup(false)
        setVerificationCode('')
        showToast('Zwei-Faktor-Authentifizierung deaktiviert', 'success')
      } else {
        showToast('Ungültiger Verifizierungscode', 'error')
      }
    } catch (error) {
      console.error('Fehler beim Deaktivieren der 2FA:', error)
      showToast('Netzwerkfehler', 'error')
    } finally {
      setIsDisabling(false)
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
        <div className="flex items-center mb-6 gap-4">
          <HeaderNavIcons />
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Zwei-Faktor-Authentifizierung
            </h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Erhöhe die Sicherheit deines Accountable Kontos durch den extra Zugriff auf dein Smartphone. Nach
          der Aktivierung ist dein Konto geschützt (selbst wenn dein Passwort verloren geht oder gestohlen
          wird), denn du musst sowohl dein Passwort als auch einen Authentifizierungscode von deinem Smart
          phone eingeben, um dich in deinem Konto anzumelden.
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
                  für dieses Konto.
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
                    variant="destructive"
                    onClick={() => setShowSetup(true)}
                    disabled={isDisabling}
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
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                    }`}>
                    {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                  </div>
                  <span className={step >= 1 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                    Authentifizierungs-App aufrufen
                  </span>

                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                    }`}>
                    {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                  </div>
                  <span className={step >= 2 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                    Code verifizieren
                  </span>

                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'
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
                        Kannst du keinen QR Code nutzen, trage stattdessen diesen{' '}
                        <button className="text-blue-600 underline">Setup Schlüssel</button> ein.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Lade zuerst eine Authentifizierungs-App herunter und installiere sie.
                      </h3>

                      <div className="mb-6">
                        <h4 className="font-medium mb-3">Google Authenticator</h4>
                        <div className="flex gap-3">
                          <img src="/app-store-badge.png" alt="Download on App Store" className="h-10" />
                          <img src="/google-play-badge.png" alt="Get it on Google Play" className="h-10" />
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        Du hast bereits eine Authentifizierungs-App? Gehe zum nächsten Schritt, um deinen Code zu verifizieren.
                      </p>

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
                      Nachdem du den Barcode gescannt hast, gib den 6-stelligen Code ein, der von deiner Authentifizierungs-App generiert wurde.
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
                      Speichere diese Codes an einem sicheren Ort. Du kannst jeden Code nur einmal verwenden, um dich anzumelden, falls du keinen Zugriff auf dein Telefon hast.
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

        {/* Disable 2FA */}
        {showSetup && twoFactorStatus.enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Zwei-Faktor-Authentifizierung deaktivieren</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gib den aktuellen 6-stelligen Code aus deiner Authentifizierungs-App ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren.
              </p>

              <div className="max-w-xs mb-4">
                <Label htmlFor="disable-code">6-stelliger Code</Label>
                <Input
                  id="disable-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowSetup(false)} variant="outline">
                  Abbrechen
                </Button>
                <Button
                  onClick={disableTwoFactor}
                  variant="destructive"
                  disabled={isDisabling || !verificationCode}
                >
                  {isDisabling ? 'Wird deaktiviert...' : 'Deaktivieren'}
                </Button>
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
              <p className="text-sm text-gray-600 mb-4">
                Falls du keinen Zugriff auf dein Telefon hast, kannst du einen dieser Codes verwenden, um dich anzumelden.
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
