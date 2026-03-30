'use client'

import { useState, useMemo } from 'react'
import { CSVData, ColumnMapping } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, ArrowLeft, Save, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface ValidationStepProps {
  data: CSVData
  mappings: ColumnMapping[]
  onBack: () => void
  onComplete: (validRows: any[]) => void
}

export function ValidationStep({ data, mappings, onBack, onComplete }: ValidationStepProps) {
  const { showToast } = useToast()
  
  // Transform initial data based on mappings
  const initialRows = useMemo(() => {
    return data.rows.map((row, index) => {
      const newRow: any = { _id: index } // Internal ID for React keys
      const errors: string[] = []
      
      mappings.forEach(map => {
        if (map.dbField === '_ignore_') return
        
        const value = row[map.csvHeader] || ''
        newRow[map.dbField] = value

        // Basic Validation
        if (!value || value.trim() === '') {
           if (['invoiceNumber', 'date', 'customerName', 'totalAmount'].includes(map.dbField)) {
             errors.push(`${map.dbField} fehlt`)
           }
        }
      })
      
      newRow._errors = errors
      return newRow
    })
  }, [data, mappings])

  const [rows, setRows] = useState<any[]>(initialRows)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle cell edit
  const handleCellChange = (rowId: number, field: string, value: string) => {
    setRows(prev => prev.map(row => {
      if (row._id !== rowId) return row
      
      const updatedRow = { ...row, [field]: value }
      
      // Re-validate row (Simplified)
      const errors: string[] = []
      mappings.forEach(map => {
        if (map.dbField === '_ignore_') return
        const val = updatedRow[map.dbField]
        if (['invoiceNumber', 'date', 'customerName', 'totalAmount'].includes(map.dbField)) {
           if (!val || val.toString().trim() === '') {
             errors.push(`${map.dbField} fehlt`)
           }
        }
      })
      updatedRow._errors = errors
      
      return updatedRow
    }))
  }

  const handleDeleteRow = (rowId: number) => {
    setRows(prev => prev.filter(r => r._id !== rowId))
  }

  const validRowCount = rows.filter(r => r._errors.length === 0).length
  const errorRowCount = rows.length - validRowCount

  const handleImport = async () => {
    if (errorRowCount > 0) {
      if (!confirm(`${errorRowCount} Zeilen enthalten Fehler und werden übersprungen. Fortfahren?`)) {
        return
      }
    }
    
    setIsSubmitting(true)
    const validRows = rows.filter(r => r._errors.length === 0)
    
    // Simulate API delay for effect
    await new Promise(resolve => setTimeout(resolve, 800))
    
    onComplete(validRows)
    setIsSubmitting(false)
  }

  // Helper to get column label
  const getFieldLabel = (key: string) => {
      const labels: Record<string, string> = {
          invoiceNumber: 'Nr.',
          date: 'Datum',
          customerName: 'Kunde',
          totalAmount: 'Betrag',
          vatAmount: 'Steuer',
          status: 'Status'
      }
      return labels[key] || key
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Stats */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
            Daten prüfen
          </h2>
          <p className="text-gray-500">
            Überprüfen und korrigieren Sie Ihre Daten vor dem Import.
          </p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 flex flex-col items-center">
              <span className="text-xs text-green-600 font-bold uppercase">Bereit</span>
              <span className="text-xl font-bold text-green-700">{validRowCount}</span>
           </div>
           {errorRowCount > 0 && (
             <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex flex-col items-center animate-pulse">
                <span className="text-xs text-red-600 font-bold uppercase">Fehler</span>
                <span className="text-xl font-bold text-red-700">{errorRowCount}</span>
             </div>
           )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 border rounded-xl overflow-hidden shadow-sm bg-white flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                {mappings.filter(m => m.dbField !== '_ignore_').map(map => (
                  <TableHead key={map.dbField} className="min-w-[150px] font-bold text-gray-700">
                    {getFieldLabel(map.dbField)}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id} className={cn("group hover:bg-blue-50/30 transition-colors", row._errors.length > 0 && "bg-red-50/30 hover:bg-red-50/50")}>
                  <TableCell>
                    {row._errors.length === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="relative group/tooltip">
                         <AlertCircle className="w-5 h-5 text-red-500 cursor-help" />
                         <div className="absolute left-8 top-0 bg-red-800 text-white text-xs p-2 rounded w-48 z-50 hidden group-hover/tooltip:block shadow-xl">
                           {row._errors.join(', ')}
                         </div>
                      </div>
                    )}
                  </TableCell>
                  
                  {mappings.filter(m => m.dbField !== '_ignore_').map(map => (
                    <TableCell key={map.dbField} className="p-2">
                      <Input 
                        value={row[map.dbField]} 
                        onChange={(e) => handleCellChange(row._id, map.dbField, e.target.value)}
                        className={cn(
                            "h-8 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent focus:bg-white transition-all",
                            map.dbField === 'totalAmount' && "font-mono font-medium text-right",
                            (!row[map.dbField] && ['invoiceNumber', 'date', 'customerName', 'totalAmount'].includes(map.dbField)) && "border-red-300 bg-red-50"
                        )}
                        placeholder="-"
                      />
                    </TableCell>
                  ))}
                  
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteRow(row._id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Zuordnung
        </Button>
        
        <Button 
          onClick={handleImport}
          disabled={validRowCount === 0 || isSubmitting}
          size="lg"
          className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 text-white px-8"
        >
          {isSubmitting ? (
             <>
               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               Importiere...
             </>
          ) : (
             <>
               <Save className="w-4 h-4 mr-2" />
               {validRowCount} Rechnungen importieren
             </>
          )}
        </Button>
      </div>

    </div>
  )
}
