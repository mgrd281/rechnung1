'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function QuickCSVTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCSVExport = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🔄 Testing CSV export...')
      
      const response = await fetch('/api/invoices/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedIds: [], // Alle Daten
          filters: {},
          includeSummary: true,
          filename: 'test_export.csv'
        })
      })

      const data = await response.json()
      console.log('📊 CSV Export Response:', data)

      if (data.success) {
        // Download starten
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setResult({
          success: true,
          message: `✅ Export erfolgreich! ${data.rowCount} Zeilen exportiert.`,
          details: {
            filename: data.filename,
            rowCount: data.rowCount,
            totalAmount: data.totalAmount
          }
        })
      } else {
        setResult({
          success: false,
          message: `❌ Export fehlgeschlagen: ${data.error}`,
          details: { error: data.error }
        })
      }

    } catch (error) {
      console.error('❌ CSV Export Error:', error)
      setResult({
        success: false,
        message: `❌ Netzwerkfehler: ${error}`,
        details: { error: String(error) }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🧪 CSV Export Schnelltest
          </h1>
          <p className="text-gray-600">
            Testen Sie den CSV-Export mit Demo-Daten
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              CSV Export Test
            </CardTitle>
            <CardDescription>
              Klicken Sie auf den Button um den CSV-Export zu testen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button
                onClick={testCSVExport}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Exportiere...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    CSV Export testen
                  </>
                )}
              </Button>
            </div>

            {result && (
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'Test erfolgreich!' : 'Test fehlgeschlagen'}
                  </span>
                </div>
                
                <p className="text-sm mb-3">{result.message}</p>
                
                {result.details && (
                  <div className="text-xs space-y-1 bg-white bg-opacity-50 p-3 rounded">
                    {result.success ? (
                      <>
                        <div><strong>Datei:</strong> {result.details.filename}</div>
                        <div><strong>Zeilen:</strong> {result.details.rowCount}</div>
                        <div><strong>Gesamtbetrag:</strong> €{result.details.totalAmount?.toFixed(2)}</div>
                      </>
                    ) : (
                      <div><strong>Fehler:</strong> {result.details.error}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Was wird getestet?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong>API-Verbindung:</strong> Verbindung zu /api/invoices/export/csv
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong>Demo-Daten:</strong> 20 Beispiel-Rechnungen mit realistischen Werten
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <strong>CSV-Format:</strong> Deutsche Excel-Kompatibilität (UTF-8 BOM, Semikolon)
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <strong>SUMME-Zeile:</strong> Automatische Berechnung aller numerischen Spalten
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <strong>Download:</strong> Automatischer Download der CSV-Datei
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Nach erfolgreichem Test können Sie den CSV Export in der Rechnungsseite verwenden
          </p>
        </div>
      </div>
    </div>
  )
}
