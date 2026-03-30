'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Mail, Settings, RefreshCw, Eye } from 'lucide-react'

export default function EmailStatusPage() {
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('')

  const checkEmailConfig = async () => {
    setLoading(true)
    try {
      // Check environment variables
      const isDev = process.env.NODE_ENV === 'development'
      const config = {
        isDevelopment: isDev,
        emailDevMode: process.env.EMAIL_DEV_MODE === 'true',
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        smtpHost: process.env.SMTP_HOST || 'Not set',
        smtpPort: process.env.SMTP_PORT || 'Not set',
        emailFrom: process.env.EMAIL_FROM || 'Not set',
        timestamp: new Date().toISOString()
      }
      
      setEmailConfig(config)
    } catch (error) {
      console.error('Error checking email config:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Bitte geben Sie eine E-Mail-Adresse ein')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/email-verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          name: 'Test User'
        })
      })

      const data = await response.json()
      setTestResult({
        success: data.success,
        message: data.success ? 'Test-E-Mail erfolgreich gesendet!' : data.error,
        messageId: data.messageId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Netzwerkfehler beim Senden der Test-E-Mail',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkEmailConfig()
  }, [])

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"} className="ml-2">
        {condition ? trueText : falseText}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📧 E-Mail System Status
          </h1>
          <p className="text-gray-600">
            Überwachung und Diagnose des E-Mail-Verifizierungssystems
          </p>
        </div>

        {/* Email Configuration Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              E-Mail-Konfiguration
              <Button
                variant="outline"
                size="sm"
                onClick={checkEmailConfig}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Aktualisieren
              </Button>
            </CardTitle>
            <CardDescription>
              Aktuelle Konfiguration und Status des E-Mail-Systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailConfig ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Umgebung:</span>
                      <div className="flex items-center">
                        {emailConfig.isDevelopment ? 'Development' : 'Production'}
                        {getStatusBadge(!emailConfig.isDevelopment, 'PROD', 'DEV')}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">E-Mail Dev Mode:</span>
                      <div className="flex items-center">
                        {emailConfig.emailDevMode ? 'Simulation' : 'Real Sending'}
                        {getStatusBadge(!emailConfig.emailDevMode, 'REAL', 'SIM')}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">SMTP User:</span>
                      <div className="flex items-center">
                        {emailConfig.hasSmtpUser ? 'Konfiguriert' : 'Nicht gesetzt'}
                        {getStatusBadge(emailConfig.hasSmtpUser, 'OK', 'FEHLT')}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">SMTP Password:</span>
                      <div className="flex items-center">
                        {emailConfig.hasSmtpPass ? 'Konfiguriert' : 'Nicht gesetzt'}
                        {getStatusBadge(emailConfig.hasSmtpPass, 'OK', 'FEHLT')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">SMTP Host:</span>
                      <span className="text-sm text-gray-600">{emailConfig.smtpHost}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">SMTP Port:</span>
                      <span className="text-sm text-gray-600">{emailConfig.smtpPort}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">From Email:</span>
                      <span className="text-sm text-gray-600">{emailConfig.emailFrom}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Letzte Prüfung:</span>
                      <span className="text-sm text-gray-600">
                        {new Date(emailConfig.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
                  {emailConfig.emailDevMode ? (
                    <div className="flex items-center text-amber-700 bg-amber-50 p-3 rounded">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <div>
                        <strong>Simulation Mode aktiv</strong>
                        <p className="text-sm mt-1">
                          E-Mails werden nur simuliert, nicht wirklich gesendet. 
                          Setzen Sie EMAIL_DEV_MODE="false" in .env.local für echte E-Mails.
                        </p>
                      </div>
                    </div>
                  ) : !emailConfig.hasSmtpUser || !emailConfig.hasSmtpPass ? (
                    <div className="flex items-center text-red-700 bg-red-50 p-3 rounded">
                      <XCircle className="h-5 w-5 mr-2" />
                      <div>
                        <strong>SMTP-Konfiguration unvollständig</strong>
                        <p className="text-sm mt-1">
                          SMTP_USER und SMTP_PASS müssen in .env.local gesetzt werden.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-700 bg-green-50 p-3 rounded">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <div>
                        <strong>E-Mail-System bereit</strong>
                        <p className="text-sm mt-1">
                          Alle erforderlichen Konfigurationen sind vorhanden.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Lade Konfiguration...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Email Sending */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Test-E-Mail senden
            </CardTitle>
            <CardDescription>
              Senden Sie eine Test-Verifizierungs-E-Mail an eine beliebige Adresse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={sendTestEmail}
                disabled={loading || !testEmail}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Test senden
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  <strong>{testResult.success ? 'Erfolgreich' : 'Fehler'}</strong>
                </div>
                <p className="text-sm mb-2">{testResult.message}</p>
                {testResult.messageId && (
                  <p className="text-xs opacity-75">Message ID: {testResult.messageId}</p>
                )}
                <p className="text-xs opacity-75">
                  Zeit: {new Date(testResult.timestamp).toLocaleString('de-DE')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Setup-Anleitung
            </CardTitle>
            <CardDescription>
              Schritt-für-Schritt Anleitung zur E-Mail-Konfiguration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">1. .env.local Datei erstellen</h4>
                <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`# E-Mail Konfiguration
EMAIL_DEV_MODE="false"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"
EMAIL_FROM_NAME="RechnungsProfi"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"`}
                </pre>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">2. Gmail App Password erstellen</h4>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Google Account → Security → 2-Step Verification aktivieren</li>
                  <li>App Passwords → Generate new password</li>
                  <li>16-stelliges Passwort kopieren und in SMTP_PASS einfügen</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">3. Server neu starten</h4>
                <p className="text-purple-700">
                  Nach der Konfiguration: Server stoppen (Ctrl+C) und neu starten (npm run dev)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
