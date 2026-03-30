'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import CSVExportButton from '@/components/csv-export-button'
import { 
  FileSpreadsheet, 
  Filter, 
  Calendar,
  Package,
  Users,
  CheckSquare,
  Square
} from 'lucide-react'

export default function TestCSVExportPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    customer: '',
    category: ''
  })

  // Beispiel-Rechnungsdaten für Demo
  const sampleInvoices = [
    { id: 'inv_1', name: 'iPhone 15 Pro', customer: 'Max Mustermann', category: 'Elektronik', amount: 1299.99 },
    { id: 'inv_2', name: 'Samsung Galaxy S24', customer: 'Anna Schmidt', category: 'Elektronik', amount: 899.99 },
    { id: 'inv_3', name: 'MacBook Air M3', customer: 'Peter Weber', category: 'Computer', amount: 1499.99 },
    { id: 'inv_4', name: 'Nike Air Max', customer: 'Lisa Müller', category: 'Sport', amount: 129.99 },
    { id: 'inv_5', name: 'Kaffeemaschine', customer: 'Tom Fischer', category: 'Haushalt', amount: 299.99 },
    { id: 'inv_6', name: 'Staubsauger Dyson', customer: 'Sarah Klein', category: 'Haushalt', amount: 399.99 },
    { id: 'inv_7', name: 'Levi\'s Jeans', customer: 'Mike Johnson', category: 'Kleidung', amount: 89.99 },
    { id: 'inv_8', name: 'Dell XPS 13', customer: 'Emma Wilson', category: 'Computer', amount: 1199.99 }
  ]

  const handleSelectAll = () => {
    if (selectedIds.length === sampleInvoices.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sampleInvoices.map(inv => inv.id))
    }
  }

  const handleSelectInvoice = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Filter-Objekt für Export vorbereiten
  const exportFilters = {
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    status: filters.status || undefined,
    customer: filters.customer || undefined,
    category: filters.category || undefined
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            📊 CSV Export Test System
          </h1>
          <p className="text-gray-600">
            Testen Sie den CSV-Export für Rechnungen mit allen Features
          </p>
        </div>

        {/* Export Button - Prominent platziert */}
        <div className="mb-8 text-center">
          <CSVExportButton
            selectedIds={selectedIds}
            filters={exportFilters}
            totalCount={sampleInvoices.length}
            className="text-lg px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0"
          />
          <p className="text-sm text-gray-500 mt-2">
            {selectedIds.length > 0 
              ? `${selectedIds.length} Rechnungen ausgewählt`
              : `Alle ${sampleInvoices.length} Rechnungen (nach Filterung)`
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Filter Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Optionen
              </CardTitle>
              <CardDescription>
                Testen Sie verschiedene Filter-Kombinationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Datum Filter */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Datum von
                </Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Datum bis</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              {/* Kategorie Filter */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Kategorie
                </Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Alle Kategorien</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Computer">Computer</option>
                  <option value="Sport">Sport</option>
                  <option value="Haushalt">Haushalt</option>
                  <option value="Kleidung">Kleidung</option>
                </select>
              </div>

              {/* Kunde Filter */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Kunde
                </Label>
                <Input
                  placeholder="Kunde suchen..."
                  value={filters.customer}
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Alle Status</option>
                  <option value="bezahlt">Bezahlt</option>
                  <option value="offen">Offen</option>
                  <option value="überfällig">Überfällig</option>
                </select>
              </div>

              {/* Filter Reset */}
              <Button
                variant="outline"
                onClick={() => setFilters({
                  dateFrom: '',
                  dateTo: '',
                  status: '',
                  customer: '',
                  category: ''
                })}
                className="w-full"
              >
                Filter zurücksetzen
              </Button>
            </CardContent>
          </Card>

          {/* Rechnungen Liste */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Rechnungen ({sampleInvoices.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedIds.length === sampleInvoices.length ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Alle abwählen
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Alle auswählen
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Wählen Sie einzelne Rechnungen für den Export aus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedIds.includes(invoice.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedIds.includes(invoice.id)}
                        onCheckedChange={() => handleSelectInvoice(invoice.id)}
                      />
                      <div>
                        <div className="font-medium">{invoice.name}</div>
                        <div className="text-sm text-gray-500">
                          {invoice.customer} • {invoice.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        €{invoice.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedIds.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-700">
                    <strong>{selectedIds.length}</strong> Rechnungen ausgewählt
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Gesamtwert: €{sampleInvoices
                      .filter(inv => selectedIds.includes(inv.id))
                      .reduce((sum, inv) => sum + inv.amount, 0)
                      .toFixed(2)
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🎯 CSV Export Features</CardTitle>
            <CardDescription>
              Alle implementierten Features im Überblick
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Format & Kompatibilität</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• UTF-8 mit BOM für Excel</li>
                  <li>• Semikolon-Separator (DE)</li>
                  <li>• Deutsche Zahlenformate (,)</li>
                  <li>• Datumsformat: dd.MM.yyyy</li>
                  <li>• Automatisches Escaping</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">🔍 Filter & Auswahl</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Manuelle Checkbox-Auswahl</li>
                  <li>• Datum-Bereich Filter</li>
                  <li>• Kategorie-Filter</li>
                  <li>• Kunden-Suche</li>
                  <li>• Status-Filter</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">📊 Daten & Spalten</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 15 vordefinierte Spalten</li>
                  <li>• Spalten-Auswahl möglich</li>
                  <li>• SUMME-Zeile automatisch</li>
                  <li>• Gewinn-Berechnung</li>
                  <li>• MwSt-Berechnung</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">⚡ Performance</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Bis 100k Datensätze</li>
                  <li>• Chunked Processing</li>
                  <li>• Keine UI-Blockierung</li>
                  <li>• Streaming Download</li>
                  <li>• Speicher-optimiert</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">🛡️ Sicherheit</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Input-Validierung</li>
                  <li>• SQL-Injection Schutz</li>
                  <li>• Rate Limiting</li>
                  <li>• Error Handling</li>
                  <li>• Audit Logging</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-teal-600">🎨 Benutzerfreundlichkeit</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Intuitive Benutzeroberfläche</li>
                  <li>• Beispiel-Download</li>
                  <li>• Erfolgs-Feedback</li>
                  <li>• Fehler-Behandlung</li>
                  <li>• Fortschritts-Anzeige</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🧪 Test-Anleitung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <strong>1. Basis-Export:</strong> Klicken Sie auf "CSV Export" ohne Auswahl → Alle Daten werden exportiert
              </div>
              <div className="bg-green-50 p-3 rounded">
                <strong>2. Selektiver Export:</strong> Wählen Sie einzelne Rechnungen aus → Nur ausgewählte werden exportiert
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <strong>3. Filter-Export:</strong> Setzen Sie Filter (z.B. Kategorie "Elektronik") → Gefilterte Daten werden exportiert
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <strong>4. Spalten-Auswahl:</strong> Aktivieren Sie "Spalten auswählen" → Wählen Sie gewünschte Spalten
              </div>
              <div className="bg-red-50 p-3 rounded">
                <strong>5. Excel-Test:</strong> Öffnen Sie die CSV-Datei in Excel → Prüfen Sie Format und SUMME-Zeile
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
