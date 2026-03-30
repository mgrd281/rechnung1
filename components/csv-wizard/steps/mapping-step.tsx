'use client'

import { useState, useEffect } from 'react'
import { CSVData, ColumnMapping } from '../types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MappingStepProps {
  data: CSVData
  onComplete: (mappings: ColumnMapping[]) => void
  onBack: () => void
}

// Target fields we want to map to
const REQUIRED_FIELDS = [
  { key: 'invoiceNumber', label: 'Rechnungsnummer', required: true, aliases: ['nr', 'number', 'id', 'invoice', 'rechnung'] },
  { key: 'date', label: 'Rechnungsdatum', required: true, aliases: ['datum', 'date', 'created', 'time'] },
  { key: 'customerName', label: 'Kundenname', required: true, aliases: ['kunde', 'customer', 'name', 'client', 'contact'] },
  { key: 'totalAmount', label: 'Gesamtbetrag', required: true, aliases: ['betrag', 'amount', 'total', 'summe', 'preis', 'price'] },
]

const OPTIONAL_FIELDS = [
  { key: 'vatAmount', label: 'Steuerbetrag', aliases: ['steuer', 'vat', 'tax', 'mwst'] },
  { key: 'status', label: 'Status', aliases: ['status', 'state', 'paid'] },
]

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

export function MappingStep({ data, onComplete, onBack }: MappingStepProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<Record<string, 'high' | 'medium' | 'low'>>({})

  // Auto-Magic Mapping Logic
  useEffect(() => {
    const newMappings: Record<string, string> = {}
    const newConfidence: Record<string, 'high' | 'medium' | 'low'> = {}
    
    // For each required DB field
    ALL_FIELDS.forEach(dbField => {
      // Find a matching CSV header
      const match = data.headers.find(header => {
        const h = header.toLowerCase().replace(/[^a-z0-9]/g, '')
        return dbField.aliases.some(alias => h.includes(alias))
      })

      if (match) {
        newMappings[dbField.key] = match
        newConfidence[dbField.key] = 'high'
      }
    })

    setMappings(newMappings)
    setConfidence(newConfidence)
  }, [data])

  const handleMappingChange = (dbKey: string, csvHeader: string) => {
    setMappings(prev => ({ ...prev, [dbKey]: csvHeader }))
    setConfidence(prev => ({ ...prev, [dbKey]: 'high' })) // User manual selection is always high confidence
  }

  const isReady = REQUIRED_FIELDS.every(f => !!mappings[f.key])

  const handleContinue = () => {
    const finalMappings: ColumnMapping[] = Object.entries(mappings).map(([dbKey, csvHeader]) => ({
      dbField: dbKey,
      csvHeader: csvHeader,
      confidence: 1 // Simplified for now
    }))
    onComplete(finalMappings)
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-purple-600" />
            Smart Mapping
          </h2>
          <p className="text-gray-500 text-lg mt-1">
            Wir haben versucht, Ihre Spalten automatisch zu erkennen. Bitte überprüfen Sie die Zuordnung.
          </p>
        </div>
        <div className="text-right">
           <span className={cn(
             "px-4 py-2 rounded-full text-sm font-bold",
             isReady ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
           )}>
             {Object.keys(mappings).length} / {REQUIRED_FIELDS.length} Pflichtfelder
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1 overflow-auto p-1">
        
        {/* Left Column: Required Fields */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Pflichtfelder</h3>
          {REQUIRED_FIELDS.map(field => (
            <div key={field.key} className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                 <label className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                   {field.label}
                   <span className="text-red-500">*</span>
                 </label>
                 {mappings[field.key] && (
                   <CheckCircle2 className="w-5 h-5 text-green-500" />
                 )}
              </div>
              
              <Select 
                value={mappings[field.key] || ''} 
                onValueChange={(val) => handleMappingChange(field.key, val)}
              >
                <SelectTrigger className={cn(
                  "h-12 text-base w-full bg-gray-50/50 border-gray-200",
                  mappings[field.key] ? "font-medium text-gray-900 border-blue-200 bg-blue-50/30" : "text-gray-400"
                )}>
                  <SelectValue placeholder="Bitte wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {data.headers.map(header => (
                    <SelectItem key={header} value={header} className="cursor-pointer">
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {mappings[field.key] && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <span className="font-semibold">Beispielwert:</span>
                  <span className="font-mono text-gray-700 truncate max-w-[200px]">
                    {data.rows[0]?.[mappings[field.key]] || '-'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Optional Fields & Preview */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Optionale Felder</h3>
          {OPTIONAL_FIELDS.map(field => (
            <div key={field.key} className="bg-white p-5 rounded-xl border border-gray-100 opacity-90 hover:opacity-100 transition-all">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-sm font-semibold text-gray-600">
                   {field.label}
                 </label>
              </div>
              <Select 
                value={mappings[field.key] || ''} 
                onValueChange={(val) => handleMappingChange(field.key, val)}
              >
                <SelectTrigger className="h-10 w-full bg-white">
                  <SelectValue placeholder="(Nicht importieren)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_ignore_">Nicht importieren</SelectItem>
                  {data.headers.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
             <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
               <AlertCircle className="w-5 h-5" />
               Datenschutz-Hinweis
             </h4>
             <p className="text-sm text-blue-800/80 leading-relaxed">
               Ihre Daten werden lokal im Browser verarbeitet und erst beim endgültigen Speichern an den Server gesendet. 
               Wir importieren nur die Spalten, die Sie hier zuweisen.
             </p>
          </div>
        </div>

      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Datei wechseln
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!isReady}
          size="lg"
          className={cn(
            "px-8 transition-all duration-300",
            isReady ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-gray-200 text-gray-400"
          )}
        >
          Weiter zur Prüfung
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
