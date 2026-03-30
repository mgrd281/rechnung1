'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { BackButton } from '@/components/navigation/back-button'

interface TestResult {
  name: string
  endpoint: string
  status: number | string
  success: boolean
  ordersCount?: number
  shopName?: string
  error?: string | null
}

interface DiagnosisResults {
  timestamp: string
  tests: TestResult[]
}

export default function ShopifyDiagnosisPage() {
  const { navigate, refresh } = useSafeNavigation()
  const [results, setResults] = useState<DiagnosisResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnosis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shopify/test-all', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnosis()
  }, [])

  const getStatusBadge = (test: TestResult) => {
    if (test.success) {
      return <Badge className="bg-green-100 text-green-800">✅ Funktioniert</Badge>
    } else {
      return <Badge variant="destructive">❌ Fehler</Badge>
    }
  }

  const getStatusIcon = (test: TestResult) => {
    if (test.success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BackButton fallbackUrl="/shopify" />
              <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Shopify API Diagnose
              </h1>
            </div>
            <Button onClick={runDiagnosis} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Erneut testen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Status Overview */}
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Shopify API Diagnose:</strong> Diese Seite testet alle Shopify API Endpoints um Probleme zu identifizieren.
            Wenn Sie "HTTP 500" Fehler erhalten, zeigt diese Diagnose wo das Problem liegt.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Diagnosefehler:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Teste alle Shopify API Endpoints...</p>
            </CardContent>
          </Card>
        )}

        {results && (
          <>
            {/* Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Diagnose Zusammenfassung</CardTitle>
                <CardDescription>
                  Getestet am: {new Date(results.timestamp).toLocaleString('de-DE')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.tests.filter(t => t.success).length}
                    </div>
                    <div className="text-sm text-gray-600">Funktioniert</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.tests.filter(t => !t.success).length}
                    </div>
                    <div className="text-sm text-gray-600">Fehler</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.tests.length}
                    </div>
                    <div className="text-sm text-gray-600">Gesamt Tests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <div className="space-y-4">
              {results.tests.map((test, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        {getStatusIcon(test)}
                        {test.name}
                      </CardTitle>
                      {getStatusBadge(test)}
                    </div>
                    <CardDescription>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {test.endpoint}
                      </code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Status Details</h4>
                        <div className="space-y-1 text-sm">
                          <div>HTTP Status: <span className="font-mono">{test.status}</span></div>
                          <div>Erfolg: <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                            {test.success ? 'Ja' : 'Nein'}
                          </span></div>
                          {test.ordersCount !== undefined && (
                            <div>Bestellungen: <span className="font-mono">{test.ordersCount}</span></div>
                          )}
                          {test.shopName && (
                            <div>Shop Name: <span className="font-mono">{test.shopName}</span></div>
                          )}
                        </div>
                      </div>

                      {test.error && (
                        <div>
                          <h4 className="font-medium text-red-900 mb-2">Fehler Details</h4>
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {test.error}
                          </div>
                        </div>
                      )}

                      {test.success && !test.error && (
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">✅ Funktioniert korrekt</h4>
                          <div className="text-sm text-green-600">
                            Dieser Endpoint funktioniert einwandfrei.
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.tests.every(t => t.success) ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Alle Tests erfolgreich!</strong> Alle Shopify API Endpoints funktionieren korrekt.
                        Wenn Sie trotzdem Probleme haben, versuchen Sie:
                        <ul className="list-disc list-inside mt-2 ml-4">
                          <li>Browser Cache leeren (Strg+F5)</li>
                          <li>Browser neu starten</li>
                          <li>Inkognito-Modus verwenden</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Probleme gefunden!</strong> Einige API Endpoints funktionieren nicht korrekt.
                        Bitte kontaktieren Sie den Support mit diesen Diagnoseergebnissen.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={() => navigate('/shopify')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Shopify Integration testen
                    </Button>
                    <Button variant="outline" onClick={() => refresh()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Seite neu laden
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
