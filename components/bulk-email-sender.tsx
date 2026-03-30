'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Send, 
  Clock, 
  CircleCheck, 
  CircleX, 
  CircleAlert,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface BulkEmailSenderProps {
  selectedInvoices: string[]
  onClose: () => void
}

interface BulkEmailProgress {
  total: number
  sent: number
  failed: number
  inProgress: boolean
  errors: Array<{
    invoiceId: string
    error: string
    timestamp: string
  }>
  startTime: string
  estimatedCompletion?: string
}

interface BulkEmailSettings {
  batchSize: number
  delayBetweenBatches: number
  maxConcurrent: number
}

export default function BulkEmailSender({ selectedInvoices, onClose }: BulkEmailSenderProps) {
  const [progress, setProgress] = useState<BulkEmailProgress | null>(null)
  const [operationId, setOperationId] = useState<string | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<BulkEmailSettings>({
    batchSize: 50,
    delayBetweenBatches: 2000,
    maxConcurrent: 10
  })
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [useCustomTemplate, setUseCustomTemplate] = useState(false)

  // Fortschritt alle zwei Sekunden aktualisieren
  useEffect(() => {
    if (!operationId || !isStarted) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/send-bulk-emails?operationId=${operationId}`)
        const data = await response.json()
        
        if (data.success) {
          setProgress(data.data)
          
          // Updates stoppen wenn der Vorgang abgeschlossen ist
          if (!data.data.inProgress) {
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Fehler beim Abrufen des Fortschritts:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [operationId, isStarted])

  // Massen-E-Mail-Versand starten
  const startBulkSending = async () => {
    try {
      const response = await fetch('/api/send-bulk-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceIds: selectedInvoices,
          ...settings,
          customSubject: useCustomTemplate && customSubject ? customSubject : undefined,
          customMessage: useCustomTemplate && customMessage ? customMessage : undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setOperationId(data.operationId)
        setIsStarted(true)
        console.log('✅ Massen-E-Mail-Versand gestartet:', data.message)
      } else {
        console.error('❌ Fehler beim Starten des Versands:', data.message)
      }
    } catch (error) {
      console.error('Fehler beim Starten des Versands:', error)
    }
  }

  // Fortschritt in Prozent berechnen
  const getProgressPercentage = () => {
    if (!progress) return 0
    const completed = progress.sent + progress.failed
    return Math.round((completed / progress.total) * 100)
  }

  // Verbleibende Zeit berechnen
  const getEstimatedTimeRemaining = () => {
    if (!progress || !progress.estimatedCompletion) return null
    
    const now = new Date().getTime()
    const completion = new Date(progress.estimatedCompletion).getTime()
    const remaining = Math.max(0, completion - now)
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes} Minuten und ${seconds} Sekunden`
    }
    return `${seconds} Sekunden`
  }

  // Empfohlene Einstellungen basierend auf der Menge abrufen
  const getRecommendedSettings = (count: number): BulkEmailSettings => {
    if (count <= 100) {
      return { batchSize: 10, delayBetweenBatches: 1000, maxConcurrent: 5 }
    } else if (count <= 1000) {
      return { batchSize: 25, delayBetweenBatches: 1500, maxConcurrent: 8 }
    } else if (count <= 5000) {
      return { batchSize: 50, delayBetweenBatches: 2000, maxConcurrent: 10 }
    } else {
      return { batchSize: 100, delayBetweenBatches: 3000, maxConcurrent: 15 }
    }
  }

  // Empfohlene Einstellungen anwenden
  const applyRecommendedSettings = () => {
    const recommended = getRecommendedSettings(selectedInvoices.length)
    setSettings(recommended)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Massen-E-Mail-Versand
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Vorgangs-Informationen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedInvoices.length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Ausgewählte Rechnungen</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {progress?.sent || 0}
                </div>
                <div className="text-sm text-gray-600">Versendet</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {progress?.failed || 0}
                </div>
                <div className="text-sm text-gray-600">Fehlgeschlagen</div>
              </CardContent>
            </Card>
          </div>

          {/* Fortschrittsbalken */}
          {progress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gesamtfortschritt</span>
                <span className="text-sm text-gray-600">
                  {getProgressPercentage()}%
                </span>
              </div>
              
              <Progress value={getProgressPercentage()} className="h-3" />
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {progress.sent + progress.failed} von {progress.total}
                </span>
                {progress.inProgress && getEstimatedTimeRemaining() && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Verbleibend: {getEstimatedTimeRemaining()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Vorgangsstatus */}
          {progress && (
            <div className="flex items-center gap-2">
              {progress.inProgress ? (
                <Badge variant="default" className="bg-blue-500">
                  <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-1"></div>
                  Wird versendet...
                </Badge>
              ) : (
                <Badge variant={progress.failed === 0 ? "default" : "destructive"} className="bg-green-500">
                  <CircleCheck className="w-3 h-3 mr-1" />
                  Versand abgeschlossen
                </Badge>
              )}
            </div>
          )}

          {/* E-Mail-Template Anpassung */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-Mail-Template
                </CardTitle>
                <div className="flex items-center gap-2">
                  <label htmlFor="useCustomTemplate" className="text-sm">Anpassen:</label>
                  <input
                    id="useCustomTemplate"
                    type="checkbox"
                    checked={useCustomTemplate}
                    onChange={(e) => setUseCustomTemplate(e.target.checked)}
                    disabled={isStarted}
                    className="w-4 h-4"
                    title="E-Mail-Template anpassen"
                  />
                </div>
              </div>
            </CardHeader>

            {useCustomTemplate && (
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="customSubject" className="block text-sm font-medium mb-2">
                    Betreff (optional)
                  </label>
                  <input
                    id="customSubject"
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={isStarted}
                    placeholder="z.B. Ihre Rechnung von [Firmenname]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leer lassen für Standard-Betreff
                  </p>
                </div>

                <div>
                  <label htmlFor="customMessage" className="block text-sm font-medium mb-2">
                    Persönliche Nachricht (optional)
                  </label>
                  <textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg h-24"
                    disabled={isStarted}
                    placeholder="z.B. Vielen Dank für Ihr Vertrauen. Bei Fragen stehen wir gerne zur Verfügung."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Diese Nachricht wird in allen E-Mails angezeigt
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Hinweis:</strong> Das E-Mail-Template ist identisch mit dem Einzelversand und enthält:
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>• Professionelles HTML-Design</li>
                    <li>• Automatische Rechnungsdetails (Nummer, Betrag, Fälligkeitsdatum)</li>
                    <li>• PDF-Anhang mit der Rechnung</li>
                    <li>• Personalisierte Anrede mit Kundenname</li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Erweiterte Einstellungen */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Leistungseinstellungen
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings ? 'Ausblenden' : 'Anzeigen'}
                </Button>
              </div>
            </CardHeader>

            {showSettings && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="batchSize" className="block text-sm font-medium mb-2">
                      Batch-Größe
                    </label>
                    <input
                      id="batchSize"
                      type="number"
                      value={settings.batchSize}
                      onChange={(e) => setSettings({
                        ...settings,
                        batchSize: parseInt(e.target.value) || 50
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="200"
                      disabled={isStarted}
                      title="Anzahl E-Mails pro Batch"
                      placeholder="50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Anzahl E-Mails pro Batch
                    </p>
                  </div>

                  <div>
                    <label htmlFor="delayBetweenBatches" className="block text-sm font-medium mb-2">
                      Verzögerung (Millisekunden)
                    </label>
                    <input
                      id="delayBetweenBatches"
                      type="number"
                      value={settings.delayBetweenBatches}
                      onChange={(e) => setSettings({
                        ...settings,
                        delayBetweenBatches: parseInt(e.target.value) || 2000
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="500"
                      max="10000"
                      disabled={isStarted}
                      title="Wartezeit zwischen Batches"
                      placeholder="2000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Wartezeit zwischen Batches
                    </p>
                  </div>

                  <div>
                    <label htmlFor="maxConcurrent" className="block text-sm font-medium mb-2">
                      Gleichzeitiger Versand
                    </label>
                    <input
                      id="maxConcurrent"
                      type="number"
                      value={settings.maxConcurrent}
                      onChange={(e) => setSettings({
                        ...settings,
                        maxConcurrent: parseInt(e.target.value) || 10
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="50"
                      disabled={isStarted}
                      title="Anzahl gleichzeitiger E-Mails"
                      placeholder="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Anzahl gleichzeitiger E-Mails
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={applyRecommendedSettings}
                    disabled={isStarted}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Empfohlene Einstellungen
                  </Button>
                  
                  <div className="text-xs text-gray-500 flex items-center">
                    Für Menge {selectedInvoices.length.toLocaleString()}: 
                    Batch {getRecommendedSettings(selectedInvoices.length).batchSize}, 
                    Verzögerung {getRecommendedSettings(selectedInvoices.length).delayBetweenBatches}ms
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Fehler */}
          {progress && progress.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <CircleX className="w-5 h-5" />
                  Fehler ({progress.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {progress.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium">Rechnung: {error.invoiceId}</div>
                      <div className="text-red-600">{error.error}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(error.timestamp).toLocaleString('ar-SA')}
                      </div>
                    </div>
                  ))}
                  {progress.errors.length > 10 && (
                    <div className="text-center text-sm text-gray-500">
                      und {progress.errors.length - 10} weitere Fehler...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steuerungsschaltflächen */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
            
            {!isStarted ? (
              <Button 
                onClick={startBulkSending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Massen-E-Mail-Versand starten
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                Vorgang läuft...
              </div>
            )}
          </div>

          {/* Zusätzliche Informationen */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CircleAlert className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800 mb-1">
                  Tipps für erfolgreichen Massen-E-Mail-Versand:
                </div>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• Für große Mengen (+5000): Verwenden Sie größere Batches mit längerer Verzögerung</li>
                  <li>• Stellen Sie sicher, dass die E-Mail-Adressen korrekt sind, bevor Sie beginnen</li>
                  <li>• Der Vorgang läuft im Hintergrund - Sie können dieses Fenster schließen</li>
                  <li>• Geschätzte Zeit: ~{Math.ceil(selectedInvoices.length / settings.batchSize * settings.delayBetweenBatches / 1000)} Sekunden</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
