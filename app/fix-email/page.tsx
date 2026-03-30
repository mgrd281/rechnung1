'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Mail, Copy, ExternalLink } from 'lucide-react'

export default function FixEmailPage() {
  const [step, setStep] = useState(1)
  const [userEmail, setUserEmail] = useState('mgrdegh90@gmail.com')
  const [copied, setCopied] = useState(false)

  const envContent = `# E-Mail Konfiguration - Kopieren Sie diese Zeilen in .env.local
EMAIL_DEV_MODE="false"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="${userEmail || 'your-email@gmail.com'}"
SMTP_PASS="your-16-character-app-password"
EMAIL_FROM="${userEmail || 'your-email@gmail.com'}"
EMAIL_FROM_NAME="RechnungsProfi"

# NextAuth (erforderlich)
NEXTAUTH_SECRET="your-very-long-random-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            🚨 E-Mail Problem lösen
          </h1>
          <p className="text-gray-600">
            Schnelle Lösung: E-Mails kommen nicht an
          </p>
        </div>

        {/* Problem Description */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Das Problem
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-700">
            <p className="mb-2">
              <strong>Symptom:</strong> Bei "E-Mail bestätigen" erscheint der Countdown, aber keine E-Mail kommt an.
            </p>
            <p>
              <strong>Ursache:</strong> Das System läuft im Entwicklungsmodus und simuliert nur E-Mails.
            </p>
          </CardContent>
        </Card>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schritt 1: Ihre Gmail-Adresse</CardTitle>
              <CardDescription>
                Geben Sie die Gmail-Adresse ein, die Sie für das Senden von E-Mails verwenden möchten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ihre-email@gmail.com"
                  className="text-lg"
                />
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!userEmail || !userEmail.includes('@')}
                  className="w-full"
                >
                  Weiter zu Schritt 2
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: App Password */}
        {step === 2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schritt 2: Gmail App-Passwort erstellen</CardTitle>
              <CardDescription>
                Sie benötigen ein spezielles App-Passwort für Gmail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Anleitung:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-blue-700">
                    <li>Gehen Sie zu <strong>myaccount.google.com</strong></li>
                    <li>Klicken Sie auf <strong>"Sicherheit"</strong></li>
                    <li>Aktivieren Sie <strong>"Bestätigung in 2 Schritten"</strong> (falls nicht aktiv)</li>
                    <li>Klicken Sie auf <strong>"App-Passwörter"</strong></li>
                    <li>Erstellen Sie ein neues App-Passwort</li>
                    <li>Kopieren Sie das 16-stellige Passwort</li>
                  </ol>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Google Account öffnen
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    className="flex-1"
                  >
                    App-Passwort erstellt ✓
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schritt 3: Konfigurationsdatei erstellen</CardTitle>
              <CardDescription>
                Erstellen Sie eine .env.local Datei im Hauptverzeichnis des Projekts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Inhalt für .env.local:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? 'Kopiert!' : 'Kopieren'}
                    </Button>
                  </div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {envContent}
                  </pre>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">Wichtig:</h4>
                  <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
                    <li>Ersetzen Sie "your-16-character-app-password" mit Ihrem echten App-Passwort</li>
                    <li>Ersetzen Sie "your-very-long-random-secret-key..." mit einem langen zufälligen String</li>
                    <li>Die Datei muss im Hauptverzeichnis des Projekts erstellt werden</li>
                  </ul>
                </div>

                <Button 
                  onClick={() => setStep(4)}
                  className="w-full"
                >
                  Datei erstellt ✓
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Restart Server */}
        {step === 4 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schritt 4: Server neu starten</CardTitle>
              <CardDescription>
                Der Server muss neu gestartet werden, damit die neuen Einstellungen geladen werden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Terminal-Befehle:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-green-700">
                    <li>Stoppen Sie den Server mit <code className="bg-green-100 px-2 py-1 rounded">Ctrl+C</code></li>
                    <li>Starten Sie ihn neu mit <code className="bg-green-100 px-2 py-1 rounded">npm run dev</code></li>
                    <li>Warten Sie bis "Ready" erscheint</li>
                  </ol>
                </div>

                <Button 
                  onClick={() => setStep(5)}
                  className="w-full"
                >
                  Server neu gestartet ✓
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Test */}
        {step === 5 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Schritt 5: Testen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-700">
              <div className="space-y-4">
                <p className="mb-4">
                  <strong>Jetzt sollte alles funktionieren!</strong>
                </p>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.open('/auth/register', '_blank')}
                    className="w-full mb-2"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Registrierung testen
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/test-email-verification', '_blank')}
                    className="w-full"
                  >
                    Test-Suite öffnen
                  </Button>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Was Sie erwarten sollten:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>E-Mail kommt innerhalb von 30 Sekunden an</li>
                    <li>Betreff: "🔐 E-Mail-Adresse bestätigen - RechnungsProfi"</li>
                    <li>6-stelliger Code ist deutlich sichtbar</li>
                    <li>"Erneut senden" funktioniert mit neuem Code</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 && (
            <Button 
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Zurück
            </Button>
          )}
          
          {step < 5 && (
            <Button 
              onClick={() => setStep(step + 1)}
              className="ml-auto"
            >
              Überspringen
            </Button>
          )}
        </div>

        {/* Quick Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Schnelle Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button 
                variant="outline"
                onClick={() => window.open('/admin/email-status', '_blank')}
                className="h-auto p-4 flex flex-col"
              >
                <Mail className="h-6 w-6 mb-2" />
                <span>E-Mail Status</span>
                <span className="text-xs text-gray-500">Diagnose-Tool</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('/test-email-verification', '_blank')}
                className="h-auto p-4 flex flex-col"
              >
                <CheckCircle className="h-6 w-6 mb-2" />
                <span>Test-Suite</span>
                <span className="text-xs text-gray-500">E-Mail testen</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                className="h-auto p-4 flex flex-col"
              >
                <ExternalLink className="h-6 w-6 mb-2" />
                <span>Google Account</span>
                <span className="text-xs text-gray-500">App-Passwort</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
