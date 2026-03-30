'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { useAuthenticatedFetch } from '@/lib/api-client'
import {
    ArrowLeft,
    Home,
    Save,
    X,
    Calculator,
    Calendar as CalendarIcon,
    Building2,
    Hash,
    Receipt,
    Tag,
    Info,
    CheckCircle2,
    Loader2
} from 'lucide-react'

function ManualFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const authenticatedFetch = useAuthenticatedFetch()
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        supplierName: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        netAmount: '',
        taxRate: '19',
        grossAmount: '',
        category: 'einkauf',
        status: 'PENDING',
        notes: '',
        fileUrl: ''
    })

    const [ocrMetadata, setOcrMetadata] = useState<{
        documentId?: string,
        ocrData?: any,
        confidence?: number
    }>({})

    const [isAiRecognized, setIsAiRecognized] = useState(false)

    // Pre-fill from OCR data if available
    useEffect(() => {
        const ocrDataStr = searchParams.get('ocrData')
        if (ocrDataStr) {
            try {
                const ocrResult = JSON.parse(decodeURIComponent(ocrDataStr))

                // Set metadata for saving later
                setOcrMetadata({
                    documentId: ocrResult.documentId,
                    ocrData: ocrResult,
                    confidence: ocrResult.confidence
                })

                setIsAiRecognized(true)

                setFormData(prev => ({
                    ...prev,
                    supplierName: ocrResult.supplierName || ocrResult.supplier || '',
                    invoiceNumber: ocrResult.invoiceNumber || '',
                    invoiceDate: ocrResult.invoiceDate || (ocrResult.date ? ocrResult.date.split('T')[0] : prev.invoiceDate),
                    dueDate: ocrResult.dueDate || '',
                    grossAmount: (ocrResult.gross || ocrResult.totalAmount || '').toString(),
                    netAmount: (ocrResult.net || '').toString(),
                    notes: prev.notes || (ocrResult.description ? `AI-Extraktion: ${ocrResult.description}` : ''),
                    fileUrl: ocrResult.fileUrl || prev.fileUrl
                }))

                if (ocrResult.gross && !ocrResult.net) {
                    const gross = parseFloat(ocrResult.gross)
                    const net = (gross / 1.19).toFixed(2)
                    setFormData(prev => ({ ...prev, netAmount: net }))
                }

                toast.success('Daten erfolgreich aus Beleg extrahiert!')
            } catch (e) {
                console.error('Failed to parse OCR data:', e)
            }
        }
    }, [searchParams])

    // Auto-calculate gross or net
    const handleAmountChange = (field: string, value: string) => {
        const val = parseFloat(value) || 0
        const rate = parseFloat(formData.taxRate) / 100

        if (field === 'netAmount') {
            const gross = (val * (1 + rate)).toFixed(2)
            setFormData(prev => ({ ...prev, netAmount: value, grossAmount: gross }))
        } else if (field === 'grossAmount') {
            const net = (val / (1 + rate)).toFixed(2)
            setFormData(prev => ({ ...prev, grossAmount: value, netAmount: net }))
        } else if (field === 'taxRate') {
            const netVal = parseFloat(formData.netAmount) || 0
            const newRate = parseFloat(value) / 100
            const gross = (netVal * (1 + newRate)).toFixed(2)
            setFormData(prev => ({ ...prev, taxRate: value, grossAmount: gross }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.supplierName || !formData.grossAmount) {
            toast.error("Bitte füllen Sie alle Pflichtfelder aus.")
            return
        }

        setIsSaving(true)
        try {
            const res = await authenticatedFetch('/api/purchase-invoices', {
                method: 'POST',
                body: JSON.stringify({
                    supplierName: formData.supplierName,
                    invoiceNumber: formData.invoiceNumber,
                    invoiceDate: formData.invoiceDate,
                    dueDate: formData.dueDate || null,
                    netAmount: parseFloat(formData.netAmount) || 0,
                    taxAmount: (parseFloat(formData.grossAmount) || 0) - (parseFloat(formData.netAmount) || 0),
                    grossAmount: parseFloat(formData.grossAmount) || 0,
                    status: formData.status,
                    category: formData.category,
                    notes: formData.notes,
                    fileUrl: formData.fileUrl,
                    // Save OCR metadata
                    documentId: ocrMetadata.documentId,
                    ocrData: ocrMetadata.ocrData,
                    confidence: ocrMetadata.confidence
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success("Einkaufsrechnung erfolgreich gespeichert!")
                router.push('/purchase-invoices')
            } else {
                const errorText = data.error || "Fehler beim Speichern."
                toast.error(errorText)
                console.error('API Error:', data)
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error("Ein Netzwerkfehler ist aufgetreten.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8 pb-32">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <HeaderNavIcons />
                    <div className="mx-1" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Beleg erfassen</h1>
                        <p className="text-sm text-slate-500">Geben Sie die Rechnungsdaten ein أو verifizieren Sie die AI-Ergebnisse</p>
                    </div>
                </div>

                {isAiRecognized && (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">Automatisch erkannt (KI). Bitte prüfen.</span>
                    </Badge>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Form Data */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-500" /> Lieferant & Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplierName" className="flex items-center gap-1">Lieferant <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="supplierName"
                                        placeholder="z.B. Adobe, Google, Lokaler Shop..."
                                        value={formData.supplierName}
                                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                                        className="bg-slate-50 border-slate-200 focus:bg-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceNumber">Rechnungsnummer</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="invoiceNumber"
                                            placeholder="RE-123..."
                                            value={formData.invoiceNumber}
                                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceDate">Rechnungsdatum</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="invoiceDate"
                                            type="date"
                                            value={formData.invoiceDate}
                                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                            className="pl-9 bg-slate-50 border-slate-200"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Fälligkeit (Optional)</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="pl-9 bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-emerald-500" /> Beträge (EUR)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="netAmount">Netto</Label>
                                    <div className="relative">
                                        <Input
                                            id="netAmount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={formData.netAmount}
                                            onChange={(e) => handleAmountChange('netAmount', e.target.value)}
                                            className="bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxRate">Steuersatz (%)</Label>
                                    <Select
                                        value={formData.taxRate}
                                        onValueChange={(val) => handleAmountChange('taxRate', val)}
                                    >
                                        <SelectTrigger className="bg-slate-50 border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="19">19% MwSt</SelectItem>
                                            <SelectItem value="7">7% MwSt</SelectItem>
                                            <SelectItem value="0">0% (Export/Kleinunternehmer)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="grossAmount" className="flex items-center gap-1 font-bold">Brutto <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            id="grossAmount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={formData.grossAmount}
                                            onChange={(e) => handleAmountChange('grossAmount', e.target.value)}
                                            className="bg-slate-50 border-slate-200 font-bold text-lg"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <Label htmlFor="notes">Notizen / Kommentar</Label>
                            <Textarea
                                id="notes"
                                placeholder="Zusätzliche Informationen..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="bg-slate-50 border-slate-200 min-h-[100px]"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Status & Category */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                            <CardTitle className="text-base">Klassifizierung</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-indigo-500" /> Kategorie
                                </Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                                >
                                    <SelectTrigger className="bg-white border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="einkauf">Wareneinkauf</SelectItem>
                                        <SelectItem value="software">Software / SaaS</SelectItem>
                                        <SelectItem value="marketing">Marketing / Ads</SelectItem>
                                        <SelectItem value="buro">Bürobedarf</SelectItem>
                                        <SelectItem value="miete">Miete / Strom</SelectItem>
                                        <SelectItem value="sonstiges">Sonstiges</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="space-y-2">
                                <Label htmlFor="status" className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-emerald-500" /> Zahlungsstatus
                                </Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger className="bg-white border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Offen</SelectItem>
                                        <SelectItem value="PAID">Bezahlt</SelectItem>
                                        <SelectItem value="CANCELLED">Storniert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Section */}
                    <div className="space-y-3">
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Speichern
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="w-full h-11"
                        >
                            Abbrechen
                        </Button>
                    </div>

                    <Card className="border-none bg-blue-50 text-blue-700">
                        <CardContent className="p-4 flex gap-3 text-xs">
                            <Info className="h-4 w-4 shrink-0" />
                            <p>Manuell erfasste Belege werden sicher in der Datenbank gespeichert und können jederzeit für die Buchhaltung exportiert werden.</p>
                        </CardContent>
                    </Card>
                </div>

            </form>
        </div>
    )
}

export default function ManualPurchaseInvoicePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>}>
            <ManualFormContent />
        </Suspense>
    )
}
