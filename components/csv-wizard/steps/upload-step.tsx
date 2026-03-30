'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone' // We might need to install this or use standard inputs
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileSpreadsheet, Upload, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { CSVData } from '../types'
import { cn } from '@/lib/utils'

interface UploadStepProps {
  onComplete: (data: CSVData) => void
}

export function UploadStep({ onComplete }: UploadStepProps) {
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (file: File) => {
    setIsParsing(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 50, // Preview first 50 rows for mapping/validation speed
      complete: (results) => {
        setIsParsing(false)
        if (results.meta.fields && results.data.length > 0) {
          onComplete({
            headers: results.meta.fields,
            rows: results.data
          })
        } else {
          setError('Diese Datei scheint leer oder ungültig zu sein.')
        }
      },
      error: (err) => {
        setIsParsing(false)
        setError(`Fehler beim Lesen der Datei: ${err.message}`)
      }
    })
  }

  // Simple Drag & Drop implementation without extra deps for now
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="h-full flex flex-col justify-center animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Smart Import</h2>
        <p className="text-gray-500 text-lg">
          Laden Sie Ihre Shopify-Export, Excel-Liste oder beliebige CSV hoch.
          <br /> Wir kümmern uns um den Rest.
        </p>
      </div>

      <div 
        className={cn(
          "max-w-2xl mx-auto w-full rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center cursor-pointer relative overflow-hidden group",
          dragActive ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50",
          error ? "border-red-200 bg-red-50/20" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('wizard-upload')?.click()}
      >
        <input 
          id="wizard-upload" 
          type="file" 
          accept=".csv,.xlsx,.xls" 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all shadow-xl",
            dragActive ? "bg-blue-600 text-white shadow-blue-200" : "bg-white text-blue-600 shadow-gray-100 group-hover:scale-110 group-hover:rotate-3"
          )}>
            {isParsing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <Upload className="w-10 h-10" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">
              {isParsing ? 'Analysiere Datei...' : 'Datei hier ablegen'}
            </h3>
            <p className="text-gray-500">
              oder <span className="text-blue-600 font-medium underline decoration-blue-200 underline-offset-2">klicken zum Auswählen</span>
            </p>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-gradient-to-tr from-emerald-100/30 to-blue-100/30 rounded-full blur-2xl pointer-events-none" />
      </div>

      {error && (
        <div className="max-w-2xl mx-auto w-full mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="text-center mt-8 text-sm text-gray-400">
        Unterstützt: .CSV, .Excel (demnächst), .Numbers
      </div>
    </div>
  )
}
