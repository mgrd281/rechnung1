'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, CheckCircle, XCircle, FileText, ArrowLeft, Download, Save, Trash2, Edit2, Check, Eye, Shield, AlertTriangle, Calculator, Loader2, ArrowRight, FileSpreadsheet, Receipt } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
// import { InvoicePreviewDialog } from '@/components/invoice-preview-dialog'
import { cn } from '@/lib/utils'
import dynamicImport from 'next/dynamic'
import { useAuth } from '@/hooks/use-auth-compat'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'

const InvoicePreviewDialog = dynamicImport(() => import('@/components/invoice-preview-dialog').then(mod => mod.InvoicePreviewDialog), {
  ssr: false
})

export const dynamic = 'force-dynamic'

export default function UploadPage() {
  const router = useRouter()
  const { navigate } = useSafeNavigation()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const authenticatedFetch = useAuthenticatedFetch()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'success' | 'error'
    message?: string
    errors?: string[]
  }>({ type: 'idle' })
  const [dragActive, setDragActive] = useState(false)
  const [previewInvoices, setPreviewInvoices] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // Edit State
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number>(-1)

  // Selection State
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)

  // Import Options
  const [importTarget, setImportTarget] = useState<'invoices' | 'accounting' | 'purchase-invoices' | 'both'>('invoices')
  const [accountingType, setAccountingType] = useState<'income' | 'expense' | 'other'>('income')

  // Progress State
  const [uploadProgress, setUploadProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  // Saving Progress State
  const [saveProgress, setSaveProgress] = useState(0)
  const [saveEstimatedTime, setSaveEstimatedTime] = useState(0)

  // Duplicates & Templates
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set())
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  useEffect(() => {
    // Fetch company settings for preview
    authenticatedFetch('/api/settings')
      .then(res => res.json())
      .then(data => setCompanySettings(data))
      .catch(err => console.error('Failed to fetch settings:', err))

    // Fetch templates
    authenticatedFetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data)
          const defaultTemplate = data.find((t: any) => t.isDefault)
          if (defaultTemplate) setSelectedTemplateId(defaultTemplate.id)
          else if (data.length > 0) setSelectedTemplateId(data[0].id)
        } else {
          console.error('Templates API returned non-array:', data)
          setTemplates([])
        }
      })
      .catch(err => {
        console.error('Failed to fetch templates:', err)
        setTemplates([])
      })
  }, [])

  // Check for duplicates when previewInvoices changes
  useEffect(() => {
    const checkDuplicates = async () => {
      if (previewInvoices.length === 0) return

      try {
        const numbers = previewInvoices.map(inv => inv.number)
        if (numbers.length === 0) return

        const res = await authenticatedFetch('/api/invoices/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numbers })
        })
        const data = await res.json()
        if (data && Array.isArray(data.duplicates)) {
          setDuplicates(new Set(data.duplicates))
        }
      } catch (error) {
        console.error('Failed to check duplicates:', error)
      }
    }

    checkDuplicates()
  }, [previewInvoices])

  // Load settings
  useEffect(() => {
    authenticatedFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.accountingType) {
          setAccountingType(data.accountingType)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadStatus({ type: 'idle' })
      setPreviewInvoices([])
      setSelectedIndices(new Set())
    }
  }

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
      const droppedFile = e.dataTransfer.files[0]
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/x-iwork-numbers-sffnumbers']
      const validExtensions = ['.csv', '.xlsx', '.numbers']

      const isValid = validTypes.includes(droppedFile.type) || validExtensions.some(ext => droppedFile.name.toLowerCase().endsWith(ext))

      if (isValid) {
        setFile(droppedFile)
        setUploadStatus({ type: 'idle' })
        setPreviewInvoices([])
        setSelectedIndices(new Set())
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Bitte wählen Sie eine CSV, Excel oder Numbers Datei aus.'
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadStatus({ type: 'idle' })
    setPreviewInvoices([])
    setSelectedIndices(new Set())
    setUploadProgress(0)
    setEstimatedTime(2) // Start with 2 seconds estimate

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev
        return prev + 10
      })
      setEstimatedTime(prev => Math.max(0, prev - 0.2))
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('importTarget', importTarget)

      const response = await authenticatedFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (response.ok) {
        setUploadProgress(100)
        setEstimatedTime(0)
        const result = await response.json()

        // Small delay to show 100% before showing results
        setTimeout(() => {
          setUploadStatus({ type: 'success', message: result.message, errors: result.errors })
          setPreviewInvoices(result.invoices || [])
          setUploading(false)
        }, 500)

        // Don't clear file yet, allow re-upload if needed
      } else {
        const error = await response.json()
        setUploadStatus({ type: 'error', message: error.error || 'Upload failed' })
        setUploading(false)
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      console.error('Upload error:', error)

      let errorMessage = 'Netzwerkfehler beim Hochladen der Datei'

      // Check for specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.'
      } else if (error.message) {
        errorMessage = `Fehler: ${error.message}`
      }

      setUploadStatus({ type: 'error', message: errorMessage })
      setUploading(false)
    }
  }

  const saveInvoices = async (invoicesToSave: any[], indicesToRemove: number[]) => {
    if (invoicesToSave.length === 0) return

    setSaving(true)
    setSaveProgress(0)

    const totalToSave = invoicesToSave.length
    // Estimate: 0.1s per invoice is a rough guess for batch processing
    const initialEstimate = Math.ceil(totalToSave * 0.05)
    setSaveEstimatedTime(initialEstimate)

    let savedCount = 0
    const chunkSize = 50 // Process 50 invoices at a time
    const failedInvoices: any[] = []
    const startTime = Date.now()

    // Let's iterate through chunks of invoicesToSave
    for (let i = 0; i < totalToSave; i += chunkSize) {
      const chunk = invoicesToSave.slice(i, i + chunkSize)

      // Update progress
      const currentProgress = Math.round((i / totalToSave) * 100)
      setSaveProgress(currentProgress)

      // Update estimated time remaining
      if (i > 0) {
        const elapsed = (Date.now() - startTime) / 1000
        const rate = i / elapsed // items per second
        const remaining = totalToSave - i
        setSaveEstimatedTime(Math.ceil(remaining / rate))
      }

      setUploadStatus({
        type: 'idle',
        message: `Speichere ${Math.min(i + chunkSize, totalToSave)} von ${totalToSave} Rechnungen...`
      })

      try {
        const response = await authenticatedFetch('/api/invoices/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoices: chunk,
            importTarget,
            accountingType,
            templateId: selectedTemplateId
          }),
        })

        if (response.ok) {
          const result = await response.json()
          savedCount += chunk.length

          // Remove these specific invoices from previewInvoices
          setPreviewInvoices(prev => prev.filter(inv => !chunk.includes(inv)))

          // Clear selection
          setSelectedIndices(prev => new Set())

        } else {
          console.error('Chunk failed', await response.json())
          failedInvoices.push(...chunk)
        }
      } catch (error) {
        console.error('Chunk error', error)
        failedInvoices.push(...chunk)
      }
    }

    setSaveProgress(100)
    setSaveEstimatedTime(0)
    setSaving(false)

    if (failedInvoices.length === 0) {
      setUploadStatus({ type: 'success', message: `${savedCount} Rechnungen erfolgreich gespeichert!` })
      if (previewInvoices.length === 0) {
        setFile(null)
        // Redirect to target section with import context
        const importId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`

        setTimeout(() => {
          let targetRoute = '/invoices'
          if (importTarget === 'accounting') {
            targetRoute = '/buchhaltung?period=all'
          } else if (importTarget === 'purchase-invoices') {
            targetRoute = '/purchase-invoices'
          }

          const glue = targetRoute.includes('?') ? '&' : '?'
          navigate(`${targetRoute}${glue}source=csv_import&importId=${importId}&count=${savedCount}`)
        }, 1500)
      }
    } else {
      setUploadStatus({
        type: 'error',
        message: `${savedCount} gespeichert. ${failedInvoices.length} konnten nicht gespeichert werden.`
      })
    }
  }

  const handleConfirmAll = () => {
    const allIndices = previewInvoices.map((_, idx) => idx)
    saveInvoices(previewInvoices, allIndices)
  }

  const handleConfirmSelected = () => {
    const selectedList = Array.from(selectedIndices).sort((a, b) => a - b)
    const invoicesToSave = selectedList.map(idx => previewInvoices[idx])
    saveInvoices(invoicesToSave, selectedList)
  }

  const handleConfirmSingle = (index: number) => {
    saveInvoices([previewInvoices[index]], [index])
  }

  const handleDelete = (index: number) => {
    const newInvoices = [...previewInvoices]
    newInvoices.splice(index, 1)
    setPreviewInvoices(newInvoices)
    setSelectedIndices(new Set())
  }

  const handleDeleteAll = () => {
    if (confirm('Sind Sie sicher, dass Sie alle importierten Rechnungen löschen möchten?')) {
      setPreviewInvoices([])
      setFile(null)
      setUploadStatus({ type: 'idle' })
      setSelectedIndices(new Set())
    }
  }

  const handleEdit = (index: number) => {
    setEditingInvoice({ ...previewInvoices[index] })
    setEditIndex(index)
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (editIndex > -1 && editingInvoice) {
      const newInvoices = [...previewInvoices]
      newInvoices[editIndex] = editingInvoice
      setPreviewInvoices(newInvoices)
      setIsEditOpen(false)
      setEditingInvoice(null)
      setEditIndex(-1)
    }
  }

  const handlePreview = (index: number) => {
    const invoice = previewInvoices[index]

    // Construct data object for InvoicePreviewDialog
    const data = {
      customer: {
        companyName: invoice.customerName,
        name: invoice.customerName,
        address: invoice.customerAddress,
        zipCode: invoice.customerZip,
        city: invoice.customerCity,
        country: invoice.customerCountry,
        type: 'company'
      },
      invoiceData: {
        invoiceNumber: invoice.number,
        date: invoice.date,
        deliveryDate: invoice.date,
        headerSubject: `Rechnung Nr. ${invoice.number}`,
        headerText: 'Vielen Dank für Ihren Auftrag. Wir stellen Ihnen folgende Leistungen in Rechnung:',
        footerText: 'Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.'
      },
      items: invoice.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: 'Stk.',
        unitPrice: item.unitPrice,
        vat: invoice.taxRate || 19,
        total: item.netAmount,
        ean: item.ean
      })),
      settings: {
        companySettings: companySettings || {}
      }
    }

    setPreviewData(data)
    setPreviewOpen(true)
  }

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIndices(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIndices.size === previewInvoices.length) {
      setSelectedIndices(new Set())
    } else {
      const allIndices = new Set(previewInvoices.map((_, idx) => idx))
      setSelectedIndices(allIndices)
    }
  }

  const steps = [
    { id: 1, name: 'Datei hochladen' },
    { id: 2, name: 'Vorschau & Prüfung' },
    { id: 3, name: 'Import abschließen' }
  ]

  const currentStep = previewInvoices.length > 0 ? 2 : 1

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 backdrop-blur-xl bg-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HeaderNavIcons />
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">CSV-Import & Belegverarbeitung</h2>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Steps */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-between">
              {steps.map((step) => {
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                return (
                  <div key={step.name} className="flex flex-col items-center bg-gray-50 px-4 relative z-10">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      isCompleted ? "border-blue-600 bg-blue-600 text-white" :
                        isCurrent ? "border-blue-600 bg-white text-blue-600" :
                          "border-gray-300 bg-white text-gray-400"
                    )}>
                      {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{step.id}</span>}
                    </div>
                    <span className={cn(
                      "mt-2 text-xs font-medium",
                      isCurrent ? "text-blue-600" : "text-gray-500"
                    )}>{step.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-lg shadow-gray-200/50 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                    </div>
                    CSV-Import & Belegverarbeitung
                  </h1>
                </div>
                <CardDescription>
                  Laden Sie Ihre Shopify-Bestellungen als CSV, Excel oder Numbers Datei hoch.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Upload Zone */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Datei auswählen</Label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.numbers,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => document.getElementById('file-input')?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                      "group relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ease-in-out",
                      dragActive ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="mb-4 flex justify-center">
                      <div className={cn(
                        "rounded-full p-4 transition-colors",
                        dragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                      )}>
                        <Upload className="h-8 w-8" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-blue-600">Datei auswählen</span> oder hier ablegen
                      </p>
                      <p className="text-xs text-gray-500">
                        CSV, Numbers oder Excel Dateien werden unterstützt
                      </p>
                    </div>
                  </div>

                  {file && (
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-blue-100">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Import Target Cards */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Importieren als:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      {
                        id: 'invoices',
                        title: 'Verkäufe',
                        description: 'Shopify-Verkäufe importieren und Rechnungen generieren.',
                        icon: FileText
                      },
                      {
                        id: 'purchase-invoices',
                        title: 'Einkaufsrechnungen',
                        description: 'Lieferantenrechnungen und Ausgaben importieren.',
                        icon: Receipt
                      },
                      {
                        id: 'accounting',
                        title: 'Buchhaltung',
                        description: 'Einnahmen/Ausgaben direkt in die Buchhaltung erfassen.',
                        icon: Calculator
                      }
                    ].map((option) => {
                      const isSelected = importTarget === option.id
                      const Icon = option.icon

                      return (
                        <div
                          key={option.id}
                          onClick={() => setImportTarget(option.id as any)}
                          className={cn(
                            "group relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center",
                            isSelected
                              ? "border-blue-600 bg-blue-50/20 shadow-[0_0_0_1px_rgba(37,99,235,1)]"
                              : "border-gray-200 bg-white shadow-sm hover:border-blue-200 hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] hover:-translate-y-[2px]"
                          )}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setImportTarget(option.id as any)
                            }
                          }}
                        >
                          <div className={cn(
                            "mb-4 p-3 rounded-full transition-colors flex items-center justify-center h-12 w-12",
                            isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-200"
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>

                          <h3 className={cn(
                            "font-bold text-lg mb-2 transition-colors",
                            isSelected ? "text-blue-900" : "text-gray-900"
                          )}>
                            {option.title}
                          </h3>

                          <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                            {option.description}
                          </p>

                          {isSelected && (
                            <div className="absolute top-4 right-4 text-blue-600 animate-in zoom-in spin-in-90 duration-300">
                              <CheckCircle className="h-6 w-6 fill-blue-50" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Accounting Type Selection */}
                  {(importTarget === 'accounting' || importTarget === 'both') && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                      <Label className="mb-2 block text-sm font-medium">Buchungstyp wählen:</Label>
                      <Select value={accountingType} onValueChange={(v: any) => setAccountingType(v)}>
                        <SelectTrigger className="w-full bg-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Einnahme</SelectItem>
                          <SelectItem value="expense">Ausgabe</SelectItem>
                          <SelectItem value="other">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Template Selection */}
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Vorlage wählen</Label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger className="w-full bg-white h-10">
                        <SelectValue placeholder="Vorlage wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-medium shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ```
                      Verarbeite Datei...
                    </>
                  ) : (
                    <>
                      Vorschau anzeigen
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {uploading && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Wird verarbeitet...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {uploadStatus.type === 'error' && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm border border-red-100">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    {uploadStatus.message}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Download */}
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-200 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <FileSpreadsheet className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">CSV-Vorlage herunterladen</h3>
                  <p className="text-sm text-gray-500">Nutzen Sie unsere Vorlage für beste Ergebnisse.</p>
                </div>
              </div>
              <a href="/api/csv-template" download="rechnungen-vorlage-mit-beispielen.csv">
                <Button variant="outline" className="bg-white hover:bg-gray-50">
                  <Download className="mr-2 h-4 w-4" />
                  Vorlage laden
                </Button>
              </a>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-lg shadow-gray-200/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Vorschau ({previewInvoices.length} Einträge)</CardTitle>
                  <CardDescription>
                    Überprüfen Sie die Daten vor dem endgültigen Import.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => { setPreviewInvoices([]); setFile(null); }}>
                    Abbrechen
                  </Button>
                  <Button onClick={selectedIndices.size > 0 ? handleConfirmSelected : handleConfirmAll} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    {selectedIndices.size > 0 ? `${selectedIndices.size} importieren` : 'Alle importieren'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="w-[50px]">
                          <Checkbox checked={previewInvoices.length > 0 && selectedIndices.size === previewInvoices.length} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                        <TableHead>Bestellnummer</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewInvoices.map((inv, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell><Checkbox checked={selectedIndices.has(idx)} onCheckedChange={() => toggleSelect(idx)} /></TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {inv.number}
                              {duplicates.has(String(inv.number)) && (
                                <span title="Duplikat">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{inv.customerName}</span>
                              <span className="text-xs text-gray-500">{inv.customerEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>{inv.date && new Date(inv.date).toLocaleDateString('de-DE')}</TableCell>
                          <TableCell className="font-mono font-medium">{inv.amount}</TableCell>
                          <TableCell><Badge variant="outline" className={inv.statusColor}>{inv.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => handlePreview(idx)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => handleEdit(idx)}><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => handleDelete(idx)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rechnung bearbeiten</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number" className="text-right">
                  Bestellnummer
                </Label>
                <Input
                  id="number"
                  value={editingInvoice.shopifyOrderNumber || editingInvoice.number}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, shopifyOrderNumber: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Kunde
                </Label>
                <Input
                  id="name"
                  value={editingInvoice.customerName}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingInvoice.customerEmail}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, customerEmail: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Datum
                </Label>
                <Input
                  id="date"
                  value={editingInvoice.date}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={editingInvoice.status}
                  onValueChange={(value) => setEditingInvoice({ ...editingInvoice, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bezahlt">Bezahlt</SelectItem>
                    <SelectItem value="Offen">Offen</SelectItem>
                    <SelectItem value="Überfällig">Überfällig</SelectItem>
                    <SelectItem value="Storniert">Storniert</SelectItem>
                    <SelectItem value="Gutschrift">Gutschrift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleSaveEdit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        data={previewData}
      />
    </div>
  )
}
