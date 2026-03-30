'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Send, CheckCircle, XCircle, BarChart3, RefreshCw } from 'lucide-react'

export default function TestEmailVerificationPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [stats, setStats] = useState<any>(null)

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleSendCode = async () => {
    if (!email || !name) {
      showMessage('Bitte füllen Sie alle Felder aus.', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/email-verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name })
      })

      const data = await response.json()

      if (data.success) {
        showMessage(`Verifizierungscode wurde an ${email} gesendet!`, 'success')
        console.log('📧 Email sent with Message ID:', data.messageId)
      } else {
        showMessage(data.error || 'Fehler beim Senden', 'error')
      }
    } catch (error) {
      console.error('Send error:', error)
      showMessage('Netzwerkfehler beim Senden', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!email || !code) {
      showMessage('Bitte geben Sie E-Mail und Code ein.', 'error')
      return
    }

    setVerifying(true)
    try {
      const response = await fetch('/api/auth/email-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('✅ Code erfolgreich verifiziert!', 'success')
        setCode('')
      } else {
        showMessage(data.error || 'Verifizierung fehlgeschlagen', 'error')
        if (data.remainingAttempts !== undefined) {
          showMessage(`${data.error} (${data.remainingAttempts} Versuche übrig)`, 'error')
        }
      }
    } catch (error) {
      console.error('Verify error:', error)
      showMessage('Netzwerkfehler bei der Verifizierung', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!email) {
      showMessage('Bitte geben Sie eine E-Mail-Adresse ein.', 'error')
      return
    }

    try {
      const response = await fetch(`/api/auth/email-verification/status?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success) {
        const status = data.isVerified ? '✅ VERIFIZIERT' : '❌ NICHT VERIFIZIERT'
        showMessage(`Status für ${email}: ${status}`, data.isVerified ? 'success' : 'info')
      } else {
        showMessage(data.error || 'Status-Abfrage fehlgeschlagen', 'error')
      }
    } catch (error) {
      console.error('Status error:', error)
      showMessage('Netzwerkfehler bei der Status-Abfrage', 'error')
    }
  }

  const handleGetStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/auth/email-verification/status?stats=true')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        showMessage('Statistiken aktualisiert', 'success')
      } else {
        showMessage('Fehler beim Laden der Statistiken', 'error')
      }
    } catch (error) {
      console.error('Stats error:', error)
      showMessage('Netzwerkfehler bei den Statistiken', 'error')
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            E-Mail-Verifizierung Testsystem
          </h1>
          <p className="text-gray-600">
            Testen Sie das E-Mail-Verifizierungssystem mit 6-stelligen Codes, Rate Limiting und Anti-Abuse
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Send Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Code senden
              </CardTitle>
              <CardDescription>
                Senden Sie einen 6-stelligen Verifizierungscode per E-Mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">E-Mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <Button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Code senden
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Verify Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Code verifizieren
              </CardTitle>
              <CardDescription>
                Verifizieren Sie den erhaltenen 6-stelligen Code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">E-Mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">6-stelliger Code</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
              </div>
              <Button
                onClick={handleVerifyCode}
                disabled={verifying}
                className="w-full"
                variant="outline"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Wird verifiziert...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Code verifizieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status and Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Status Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Status prüfen
              </CardTitle>
              <CardDescription>
                Prüfen Sie den Verifizierungsstatus einer E-Mail-Adresse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCheckStatus}
                disabled={!email}
                className="w-full"
                variant="secondary"
              >
                Status prüfen
              </Button>
            </CardContent>
          </Card>

          {/* System Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                System-Statistiken
              </CardTitle>
              <CardDescription>
                Aktuelle Statistiken des Verifizierungssystems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGetStats}
                disabled={statsLoading}
                className="w-full"
                variant="secondary"
              >
                {statsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Lädt...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Statistiken laden
                  </>
                )}
              </Button>

              {stats && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Aktive Codes:</span>
                    <span className="font-bold">{stats.activeCodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gesamt-Versuche:</span>
                    <span className="font-bold">{stats.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erfolgreiche Verifikationen:</span>
                    <span className="font-bold text-green-600">{stats.successfulVerifications}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blockierte IPs:</span>
                    <span className="font-bold text-red-600">{stats.blockedIPs}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Display */}
        {message && (
          <Card className={`mb-6 ${
            messageType === 'success' ? 'border-green-200 bg-green-50' :
            messageType === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <CardContent className="pt-6">
              <div className={`flex items-center ${
                messageType === 'success' ? 'text-green-700' :
                messageType === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {messageType === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
                {messageType === 'error' && <XCircle className="h-5 w-5 mr-2" />}
                {messageType === 'info' && <Mail className="h-5 w-5 mr-2" />}
                {message}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 Implementierte Features</CardTitle>
            <CardDescription>
              Übersicht über alle implementierten Sicherheits- und Anti-Abuse-Features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Sicherheit</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 6-stellige Zufallscodes</li>
                  <li>• 10 Minuten Gültigkeit</li>
                  <li>• Sichere Code-Hashing</li>
                  <li>• Einmalige Verwendung</li>
                  <li>• IP-basiertes Tracking</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-600">⚡ Rate Limiting</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Max. 5 Versuche pro Code</li>
                  <li>• Max. 5 E-Mails pro Stunde</li>
                  <li>• 60s Cooldown zwischen Anfragen</li>
                  <li>• Temporäre Sperren (30 Min)</li>
                  <li>• Automatisches Cleanup</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">📧 E-Mail-Features</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Professionelle HTML-Templates</li>
                  <li>• Deutscher Betreff und Inhalt</li>
                  <li>• Optional: Bestätigungslinks</li>
                  <li>• Entwicklungsmodus-Simulation</li>
                  <li>• Detailliertes Logging</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">🛡️ Anti-Abuse</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• IP-Adresse Tracking</li>
                  <li>• User-Agent Logging</li>
                  <li>• Missbrauch-Erkennung</li>
                  <li>• Audit Trail</li>
                  <li>• System-Monitoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
