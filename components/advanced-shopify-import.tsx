'use client'

// Erweiterte Shopify Import Oberfläche mit Progress und Control
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Download,
  Calendar,
  Filter,
  CircleAlert,
  CircleCheck,
  Clock,
  Zap,
  Database,
  TrendingUp
} from 'lucide-react'
import { DateFilterManager, quickFilters, paymentStatusFilters, orderStatusFilters } from '@/lib/date-filters'
import type { JobStatus } from '@/lib/background-jobs'

interface ImportStats {
  totalOrders: number
  imported: number
  failed: number
  duplicates: number
  inProgress: boolean
  estimatedTimeRemaining?: number
}

interface ImportFilters {
  dateRange: 'today' | 'thisWeek' | 'thisMonth' | 'last7Days' | 'last30Days' | 'custom'
  customDateFrom?: string
  customDateTo?: string
  financialStatus?: string
  fulfillmentStatus?: string
  orderStatus?: string
  search?: string
}

export default function AdvancedShopifyImport() {
  // State management
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null)
  const [importStats, setImportStats] = useState<ImportStats>({
    totalOrders: 0,
    imported: 0,
    failed: 0,
    duplicates: 0,
    inProgress: false
  })
  const [filters, setFilters] = useState<ImportFilters>({
    dateRange: 'last30Days',
    financialStatus: '',
    fulfillmentStatus: '',
    orderStatus: '',
    search: ''
  })
  const [importMode, setImportMode] = useState<'rest' | 'bulk'>('rest')
  const [isImporting, setIsImporting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [recentJobs, setRecentJobs] = useState<JobStatus[]>([])

  // Refs für die Steuerung der Operationen
  const abortControllerRef = useRef<AbortController | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Statistiken aus dem aktuellen Job aktualisieren
  const updateStatsFromJob = useCallback((job: JobStatus) => {
    setImportStats({
      totalOrders: job.progress.total,
      imported: job.results.imported,
      failed: job.results.failed,
      duplicates: job.results.duplicates,
      inProgress: job.status === 'running' || job.status === 'pending',
      estimatedTimeRemaining: job.progress.estimatedTimeRemaining
    })
    setErrors(job.results.errors)
  }, [])

  // Job-Status abfragen
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/shopify/orders/import?jobId=${jobId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentJob(data.job)
        updateStatsFromJob(data.job)

        // Polling stoppen wenn Job beendet ist
        if (['completed', 'failed', 'cancelled'].includes(data.job.status)) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setIsImporting(false)
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error)
    }
  }, [updateStatsFromJob])

  // Import starten
  const startImport = useCallback(async () => {
    if (isImporting) {
      console.log('⚠️ Import already in progress, ignoring request')
      return
    }

    // Mehrfachklicks verhindern
    setIsImporting(true)
    setErrors([])

    try {
      // Neuen AbortController erstellen
      abortControllerRef.current = new AbortController()

      // Datumsbereich erstellen
      let dateFrom: string | undefined
      let dateTo: string | undefined

      if (filters.dateRange === 'custom') {
        dateFrom = filters.customDateFrom
        dateTo = filters.customDateTo
      } else {
        const range = quickFilters[filters.dateRange]()
        dateFrom = range.from
        dateTo = range.to
      }

      // Import-Anfrage senden
      const response = await fetch('/api/shopify/orders/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: importMode,
          dateFrom,
          dateTo,
          financialStatus: filters.financialStatus || undefined,
          fulfillmentStatus: filters.fulfillmentStatus || undefined,
          status: filters.orderStatus || undefined,
          search: filters.search || undefined
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start import')
      }

      const result = await response.json()
      console.log('🚀 Import started:', result)

      // Status-Polling starten
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(result.jobId)
      }, 2000) // Alle 2 Sekunden

      // Sofortiges Polling
      await pollJobStatus(result.jobId)

    } catch (error: any) {
      console.error('❌ Import failed:', error)
      setErrors([error.message])
      setIsImporting(false)
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [isImporting, importMode, filters, pollJobStatus])

  // Import pausieren
  const pauseImport = useCallback(async () => {
    if (!currentJob) return

    try {
      const response = await fetch('/api/shopify/orders/import', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: currentJob.id,
          action: 'pause'
        })
      })

      if (response.ok) {
        console.log('⏸️ Import paused')
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    } catch (error) {
      console.error('Error pausing import:', error)
    }
  }, [currentJob])

  // Import abbrechen
  const cancelImport = useCallback(async () => {
    if (!currentJob) return

    try {
      const response = await fetch('/api/shopify/orders/import', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: currentJob.id,
          action: 'cancel'
        })
      })

      if (response.ok) {
        console.log('🛑 Import cancelled')
        setIsImporting(false)
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }

        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
          abortControllerRef.current = null
        }
      }
    } catch (error) {
      console.error('Error cancelling import:', error)
    }
  }, [currentJob])

  // Import fortsetzen
  const resumeImport = useCallback(async () => {
    if (!currentJob) return

    try {
      const response = await fetch('/api/shopify/orders/import', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: currentJob.id,
          action: 'resume'
        })
      })

      if (response.ok) {
        console.log('▶️ Import resumed')
        setIsImporting(true)
        
        // Polling neu starten
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
        
        pollingIntervalRef.current = setInterval(() => {
          pollJobStatus(currentJob.id)
        }, 2000)
      }
    } catch (error) {
      console.error('Error resuming import:', error)
    }
  }, [currentJob, pollJobStatus])

  // Letzte Jobs laden
  const loadRecentJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/shopify/orders/import')
      if (response.ok) {
        const data = await response.json()
        setRecentJobs(data.jobs.slice(0, 5)) // Letzte 5 Jobs
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error)
    }
  }, [])

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Letzte Jobs beim Mount laden
  useEffect(() => {
    loadRecentJobs()
  }, [loadRecentJobs])

  // Verbleibende Zeit formatieren
  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return 'Unbekannt'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  // Status-Farbe ermitteln
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Erweiterte Shopify Import</h2>
          <p className="text-gray-600">Unbegrenzter Import mit Fortschrittsverfolgung und vollständiger Kontrolle</p>
        </div>
        <Button 
          onClick={loadRecentJobs}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Schnelle Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Gesamte Bestellungen</p>
                <p className="text-2xl font-bold">{importStats.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CircleCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Importiert</p>
                <p className="text-2xl font-bold text-green-600">{importStats.imported.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CircleAlert className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Fehlgeschlagen</p>
                <p className="text-2xl font-bold text-red-600">{importStats.failed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Duplikate</p>
                <p className="text-2xl font-bold text-purple-600">{importStats.duplicates.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">Neuer Import</TabsTrigger>
          <TabsTrigger value="progress">Fortschritt</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        {/* Tab für neuen Import */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Import Filter</span>
              </CardTitle>
              <CardDescription>
                Bestimmen Sie den Datumsbereich und Filter für die zu importierenden Bestellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import-Typ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Import-Typ</Label>
                  <Select value={importMode} onValueChange={(value: 'rest' | 'bulk') => setImportMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rest">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>REST API (schnell)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bulk">
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>GraphQL Bulk (für große Mengen)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Datumsbereich</Label>
                  <Select 
                    value={filters.dateRange} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Heute</SelectItem>
                      <SelectItem value="thisWeek">Diese Woche</SelectItem>
                      <SelectItem value="thisMonth">Dieser Monat</SelectItem>
                      <SelectItem value="last7Days">Letzte 7 Tage</SelectItem>
                      <SelectItem value="last30Days">Letzte 30 Tage</SelectItem>
                      <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Benutzerdefinierte Daten */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Von Datum</Label>
                    <Input
                      type="date"
                      value={filters.customDateFrom || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customDateFrom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bis Datum</Label>
                    <Input
                      type="date"
                      value={filters.customDateTo || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customDateTo: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Status Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Zahlungsstatus</Label>
                  <Select 
                    value={filters.financialStatus || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, financialStatus: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      {Object.entries(paymentStatusFilters).map(([key, filter]) => (
                        <SelectItem key={key} value={filter.financial_status}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bestellstatus</Label>
                  <Select 
                    value={filters.orderStatus || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, orderStatus: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      {Object.entries(orderStatusFilters).map(([key, filter]) => (
                        <SelectItem key={key} value={filter.status}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Suche</Label>
                  <Input
                    placeholder="Bestellnummer, Kunde, E-Mail..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>

              {/* Steuerungsschaltflächen */}
              <div className="flex items-center space-x-4 pt-4">
                <Button
                  onClick={startImport}
                  disabled={isImporting}
                  size="lg"
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Import läuft...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Import starten ({importMode.toUpperCase()})
                    </>
                  )}
                </Button>

                {currentJob && currentJob.status === 'running' && (
                  <Button onClick={pauseImport} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pausieren
                  </Button>
                )}

                {currentJob && currentJob.status === 'paused' && (
                  <Button onClick={resumeImport} variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Fortsetzen
                  </Button>
                )}

                {currentJob && ['running', 'paused'].includes(currentJob.status) && (
                  <Button onClick={cancelImport} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fortschritt Tab */}
        <TabsContent value="progress" className="space-y-4">
          {currentJob ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Import-Fortschritt</CardTitle>
                  <Badge className={getStatusColor(currentJob.status)}>
                    {currentJob.status}
                  </Badge>
                </div>
                <CardDescription>
                  Job: {currentJob.id} • Typ: {currentJob.data.mode.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fortschrittsbalken */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fortschritt: {currentJob.progress.current} / {currentJob.progress.total}</span>
                    <span>{currentJob.progress.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={currentJob.progress.percentage} className="h-2" />
                </div>

                {/* Zusätzliche Informationen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Gestartet am</p>
                    <p className="font-medium">
                      {DateFilterManager.formatDateForDisplay(currentJob.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Letztes Update</p>
                    <p className="font-medium">
                      {DateFilterManager.formatDateForDisplay(currentJob.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Verbleibende Zeit</p>
                    <p className="font-medium">
                      {formatTimeRemaining(currentJob.progress.estimatedTimeRemaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Erfolgsrate</p>
                    <p className="font-medium">
                      {currentJob.progress.total > 0 
                        ? ((currentJob.results.imported / currentJob.progress.total) * 100).toFixed(1)
                        : 0
                      }%
                    </p>
                  </div>
                </div>

                {/* Fehler */}
                {errors.length > 0 && (
                  <Alert>
                    <CircleAlert className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Import-Fehler ({errors.length}):</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {errors.slice(0, 5).map((error, index) => (
                            <p key={index} className="text-sm text-red-600">• {error}</p>
                          ))}
                          {errors.length > 5 && (
                            <p className="text-sm text-gray-500">... und {errors.length - 5} weitere Fehler</p>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Kein aktiver Import-Job</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Verlauf Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verlauf der letzten Jobs</CardTitle>
              <CardDescription>Letzte 5 Import-Jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        <div>
                          <p className="font-medium">{job.data.mode.toUpperCase()} Import</p>
                          <p className="text-sm text-gray-600">
                            {DateFilterManager.formatDateForDisplay(job.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-center space-y-4">
                        <div className="text-lg font-semibold text-gray-900">
                          🚀 Erweiterte Shopify Import System
                        </div>
                        <div className="text-sm text-gray-600 max-w-2xl mx-auto">
                          Unbegrenzter Import von Bestellungen mit Background Jobs, Cursor-based Pagination 
                          und intelligentem Rate Limiting. Unterstützt Pause/Resume mit Echtzeit-Fortschritt.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Keine vorherigen Jobs</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
