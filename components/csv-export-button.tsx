'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Download,
  FileSpreadsheet,
  Settings,
  CircleCheck,
  CircleAlert,
  Loader2,
  Eye
} from 'lucide-react'

interface CSVExportButtonProps {
  selectedIds?: string[]
  filters?: {
    dateFrom?: Date
    dateTo?: Date
    status?: string
    customer?: string
    category?: string
    searchQuery?: string
    displayedInvoices?: string[]
  }
  totalCount?: number
  selectedCount?: number
  className?: string
}

interface ExportColumn {
  key: string
  label: string
  type: string
}

export default function CSVExportButton({
  selectedIds = [],
  filters = {},
  totalCount = 0,
  selectedCount = 0,
  className = ""
}: CSVExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customFilename, setCustomFilename] = useState('')
  const [includeSummary, setIncludeSummary] = useState(true)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [availableColumns, setAvailableColumns] = useState<ExportColumn[]>([])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [exportResult, setExportResult] = useState<any>(null)

  // Lade verfügbare Spalten beim Öffnen
  const loadColumns = async () => {
    try {
      const response = await fetch('/api/invoices/export/csv?action=columns')
      const data = await response.json()

      if (data.success) {
        setAvailableColumns(data.columns)
        setSelectedColumns(data.columns.map((col: ExportColumn) => col.key))
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalten:', error)
    }
  }

  // CSV-Export durchführen
  const handleExport = async () => {
    setLoading(true)
    setExportResult(null)

    try {
      const exportData = {
        selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
        filters,
        columns: showColumnSelector ? selectedColumns : undefined,
        includeSummary,
        filename: effectiveFilename,
        largeDataset: exportInfo.count > 10000
      }

      console.log('🔄 Starting CSV export:', exportData)

      const response = await fetch('/api/invoices/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      })

      const result = await response.json()

      if (result.success) {
        // Download starten
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setExportResult({
          success: true,
          message: `✅ ${result.rowCount} Datensätze erfolgreich exportiert`,
          filename: result.filename,
          rowCount: result.rowCount,
          totalAmount: result.totalAmount
        })

        // Dialog nach 2 Sekunden schließen
        setTimeout(() => {
          setIsOpen(false)
          setExportResult(null)
        }, 2000)

      } else {
        setExportResult({
          success: false,
          message: result.error || 'Export fehlgeschlagen'
        })
      }

    } catch (error) {
      console.error('CSV Export Fehler:', error)
      setExportResult({
        success: false,
        message: 'Netzwerkfehler beim Export'
      })
    } finally {
      setLoading(false)
    }
  }

  // Spalten-Auswahl umschalten
  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    )
  }

  // Alle Spalten auswählen/abwählen
  const toggleAllColumns = () => {
    setSelectedColumns(
      selectedColumns.length === availableColumns.length
        ? []
        : availableColumns.map(col => col.key)
    )
  }

  // Export-Info Text und Zählung - genau wie "als ZIP"
  const getExportInfo = () => {
    if (selectedCount > 0) {
      return {
        count: selectedCount,
        text: `✅ ${selectedCount} Datensatz${selectedCount === 1 ? '' : 'sätze'} ausgewählt – es werden genau diese exportiert`,
        type: 'selected' as const,
        buttonText: `${selectedCount} ausgewählte Datensätze werden exportiert`
      }
    } else if (filters?.displayedInvoices && filters.displayedInvoices.length > 0) {
      return {
        count: filters.displayedInvoices.length,
        text: `alle gefilterten ${filters.displayedInvoices.length} Datensätze werden exportiert`,
        type: 'filtered' as const,
        buttonText: `alle gefilterten ${filters.displayedInvoices.length} Datensätze werden exportiert`
      }
    } else {
      // Fallback für 0 Ergebnisse: Demo-Daten anbieten
      if (totalCount === 0) {
        return {
          count: 20,
          text: `⚠️ Keine Daten gefunden - Es werden 20 Demo-Datensätze exportiert`,
          type: 'all' as const,
          buttonText: `20 Demo-Datensätze exportieren`
        }
      }

      return {
        count: totalCount,
        text: `alle ${totalCount} Datensätze werden exportiert`,
        type: 'all' as const,
        buttonText: `alle ${totalCount} Datensätze werden exportiert`
      }
    }
  }

  const exportInfo = getExportInfo()
  const canExport = exportInfo.count > 0

  // Automatischer Dateiname basierend auf Export-Typ
  const getDefaultFilename = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-') // HH-mm

    let prefix = 'rechnungen_export'
    if (exportInfo.type === 'selected') {
      prefix = `rechnungen_ausgewählt_${exportInfo.count}`
    } else if (exportInfo.type === 'filtered') {
      prefix = `rechnungen_gefiltert_${exportInfo.count}`
    } else {
      prefix = `rechnungen_alle_${exportInfo.count}`
    }

    return `${prefix}_${dateStr}_${timeStr}.csv`
  }

  // Automatischen Dateinamen setzen wenn leer
  const effectiveFilename = customFilename || getDefaultFilename()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`${className}`}
          onClick={() => {
            setIsOpen(true)
            loadColumns()
          }}
          title={selectedCount > 0 ? `${selectedCount} ausgewählte Rechnungen als CSV exportieren` : 'Alle Rechnungen als CSV exportieren'}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {selectedCount > 0 ? `${selectedCount} als CSV` : 'CSV'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            CSV Export - Rechnungen
          </DialogTitle>
          <DialogDescription>
            Exportieren Sie Ihre Rechnungsdaten als CSV-Datei (Excel-kompatibel)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export-Info */}
          <div className={`p-4 rounded-lg border-2 ${canExport
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
            }`}>
            <div className={`flex items-center ${canExport ? 'text-green-700' : 'text-red-700'
              }`}>
              {exportInfo.type === 'selected' ? (
                <CircleCheck className="h-5 w-5 mr-2" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 mr-2" />
              )}
              <span className="font-bold text-lg">{exportInfo.text}</span>
            </div>
            {canExport ? (
              <div className="text-sm text-green-600 mt-2">
                ✅ Format: UTF-8 CSV mit Semikolon-Trennung (Excel Deutschland)
              </div>
            ) : (
              <div className="text-sm text-red-600 mt-2">
                ❌ Keine Daten zum Exportieren verfügbar
              </div>
            )}
          </div>

          {/* Zusätzlicher Bestätigungsstreifen für manuelle Auswahl */}
          {exportInfo.type === 'selected' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex items-center">
                <CircleCheck className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Manuelle Auswahl bestätigt
                </span>
              </div>
              <div className="text-sm text-blue-700 mt-1">
                Es werden exakt die {selectedCount} ausgewählten Rechnungen exportiert,
                unabhängig von anderen Filtern oder der Seitenansicht.
              </div>
            </div>
          )}

          {/* Dateiname */}
          <div className="space-y-2">
            <Label htmlFor="filename">Dateiname (optional)</Label>
            <Input
              id="filename"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder={effectiveFilename}
              disabled={!canExport}
            />
            <div className="text-xs text-gray-500">
              {canExport
                ? `Automatischer Name: ${effectiveFilename}`
                : 'Dateiname nicht verfügbar - keine Daten zum Exportieren'
              }
            </div>
          </div>

          {/* Optionen */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="summary"
                checked={includeSummary}
                onCheckedChange={(checked) => setIncludeSummary(!!checked)}
              />
              <Label htmlFor="summary">SUMME-Zeile am Ende hinzufügen</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="columns"
                checked={showColumnSelector}
                onCheckedChange={(checked) => setShowColumnSelector(!!checked)}
              />
              <Label htmlFor="columns">Spalten auswählen</Label>
            </div>
          </div>

          {/* Spalten-Auswahl */}
          {showColumnSelector && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Zu exportierende Spalten:</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllColumns}
                >
                  {selectedColumns.length === availableColumns.length ? 'Keine' : 'Alle'} auswählen
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500">
                {selectedColumns.length} von {availableColumns.length} Spalten ausgewählt
              </div>
            </div>
          )}

          {/* Export-Ergebnis */}
          {exportResult && (
            <div className={`p-4 rounded-lg ${exportResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}>
              <div className={`flex items-center ${exportResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                {exportResult.success ? (
                  <CircleCheck className="h-5 w-5 mr-2" />
                ) : (
                  <CircleAlert className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">
                  {exportResult.success ? 'Export erfolgreich!' : 'Export fehlgeschlagen'}
                </span>
              </div>

              <div className={`text-sm mt-1 ${exportResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                {exportResult.message}
              </div>

              {exportResult.success && (
                <div className="text-xs text-green-600 mt-2 space-y-1">
                  <div>Datei: {exportResult.filename}</div>
                  <div>Zeilen: {exportResult.rowCount}</div>
                  <div>Gesamtgewinn: €{exportResult.totalAmount?.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/invoices/export/csv?action=sample')
                  const data = await response.json()
                  if (data.success) {
                    const blob = new Blob([data.sample], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'sample_export.csv'
                    link.click()
                    URL.revokeObjectURL(url)
                  }
                } catch (error) {
                  console.error('Fehler beim Laden der Beispieldaten:', error)
                }
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Beispiel ansehen
            </Button>

            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>

              <Button
                onClick={handleExport}
                disabled={loading || !canExport || (showColumnSelector && selectedColumns.length === 0)}
                className={canExport ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exportiere {exportInfo.count} Datensätze...
                  </>
                ) : canExport ? (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {exportInfo.count} Datensätze herunterladen
                  </>
                ) : (
                  <>
                    <CircleAlert className="h-4 w-4 mr-2" />
                    Keine Daten verfügbar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
