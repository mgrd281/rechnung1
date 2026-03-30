'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ZoomIn, ZoomOut, X, Upload, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'


interface InvoicePreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    design?: any
    onDesignChange?: (design: any) => void
    data: {
        customer: any
        invoiceData: any
        items: any[]
        settings: any
    }
}


export function InvoicePreviewDialog({ open, onOpenChange, data, design, onDesignChange }: InvoicePreviewDialogProps) {
    const [zoom, setZoom] = useState(100)

    // Initialize from design prop if available, else defaults
    const [logoSize, setLogoSize] = useState(design?.logoScale ? design.logoScale * 100 : 50)
    const [selectedColor, setSelectedColor] = useState(design?.themeColor || '#1e293b')
    const [showSettings, setShowSettings] = useState(design?.showSettings || {
        qrCode: false,
        epcQrCode: false,
        customerNumber: true,
        contactPerson: true,
        vatPerItem: false,
        articleNumber: false,
        foldMarks: true,
        paymentTerms: true,
        bankDetails: true,
        taxId: true
    })
    const [selectedLayout, setSelectedLayout] = useState<'classic' | 'modern' | 'minimal' | 'bold'>(design?.templateId || 'classic')
    const [isAdditionalSettingsOpen, setIsAdditionalSettingsOpen] = useState(false)

    const [localCompanySettings, setLocalCompanySettings] = useState<any>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Notify parent of changes to design settings
    useEffect(() => {
        if (!onDesignChange) return
        onDesignChange({
            templateId: selectedLayout,
            themeColor: selectedColor,
            logoScale: logoSize / 100,
            showSettings
        })
    }, [selectedLayout, selectedColor, logoSize, showSettings])

    // Mock colors
    const colors = [
        '#1e293b', // Slate
        '#ef4444', // Red
        '#f97316', // Orange
        '#eab308', // Yellow
        '#22c55e', // Green
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#d946ef', // Fuchsia
    ]

    if (!data) return null

    const { customer, invoiceData, items, settings } = data

    // Initialize local settings from props
    useEffect(() => {
        if (settings.companySettings) {
            setLocalCompanySettings(settings.companySettings)
        } else {
            // Fetch real settings if not provided
            fetch('/api/company-settings')
                .then(res => res.json())
                .then(data => setLocalCompanySettings(data))
                .catch(err => console.error('Error fetching settings:', err))
        }
    }, [settings.companySettings])

    const cs = localCompanySettings || {}

    // Live Preview Sync (Debounced)
    useEffect(() => {
        if (!open || !localCompanySettings) return

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const response = await fetch('/api/invoices/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        invoiceData,
                        customer,
                        items,
                        organization: localCompanySettings,
                        layout: selectedLayout,
                        primaryColor: selectedColor,
                        logoSize: logoSize,
                        showSettings,
                        subtotal: netTotal,
                        taxAmount: vatTotal,
                        total: grossTotal
                    })
                })

                if (!response.ok) throw new Error('Preview generation failed')

                const blob = await response.blob()
                const url = URL.createObjectURL(blob)

                // Cleanup old URL
                if (pdfUrl) URL.revokeObjectURL(pdfUrl)
                setPdfUrl(url)
                setLoading(false)
            } catch (err) {
                console.error(err)
                setError('Vorschau konnte nicht geladen werden')
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [open, localCompanySettings, invoiceData, customer, items, selectedLayout, selectedColor, logoSize, showSettings])

    // Calculate totals safely
    const netTotal = items?.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0) || 0
    const vatTotal = items?.reduce((sum: number, item: any) => {
        const itemNet = Number(item.total) || 0
        const itemVatRate = Number(item.vat) || 0
        return sum + (itemNet * (itemVatRate / 100))
    }, 0) || 0
    const grossTotal = netTotal + vatTotal

    // Calculate VAT by rate groups
    const vatByRate = items?.reduce((acc: any, item: any) => {
        const rate = Number(item.vat) || 0
        const itemNet = Number(item.total) || 0
        if (!acc[rate]) {
            acc[rate] = { rate, net: 0, vat: 0 }
        }
        acc[rate].net += itemNet
        acc[rate].vat += itemNet * (rate / 100)
        return acc
    }, {}) || {}
    const vatGroups = Object.values(vatByRate).sort((a: any, b: any) => b.rate - a.rate)

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            alert('Die Datei ist zu groß. Maximale Größe: 10MB')
            return
        }

        const formData = new FormData()
        formData.append('logo', file)

        try {
            const response = await fetch('/api/upload-logo', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                // Update local state to show new logo immediately
                setLocalCompanySettings((prev: any) => ({
                    ...prev,
                    logoPath: result.filename
                }))
            } else {
                alert('Fehler beim Hochladen des Logos')
            }
        } catch (error) {
            console.error('Error uploading logo:', error)
            alert('Fehler beim Hochladen des Logos')
        }
    }

    // Generate EPC QR Code content (GiroCode)
    const generateGiroCode = () => {
        if (!cs.iban || !cs.bic) return ''
        const amount = isNaN(grossTotal) ? 0 : grossTotal
        return `BCD\n002\n1\nSCT\n${cs.bic}\n${cs.companyName}\n${cs.iban}\n${amount.toFixed(2)}\nEUR\n\n${invoiceData.invoiceNumber || ''}\n`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[98vw] h-[95vh] p-0 gap-0 flex flex-col md:flex-row overflow-hidden bg-gray-100">

                {/* Left: Preview Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {/* Toolbar */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur shadow-sm border rounded-full px-4 py-2 flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(50, z - 10))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(150, z + 10))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Scrollable Canvas Container */}
                    <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-gray-200/50">
                        {loading && !pdfUrl && (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">PDF wird generiert...</p>
                            </div>
                        )}

                        {pdfUrl ? (
                            <div
                                className="relative shadow-2xl bg-white w-full max-w-[1000px] h-full transition-transform origin-top flex flex-col"
                                style={{ transform: `scale(${zoom / 100})`, height: 'calc(100% - 2rem)' }}
                            >
                                {loading && (
                                    <div className="absolute top-0 right-0 p-4 z-20">
                                        <div className="bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm border flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Aktualisiere...</span>
                                        </div>
                                    </div>
                                )}
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                                    className="w-full h-full border-none"
                                    title="Invoice Preview"
                                />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <p className="text-red-500 font-bold mb-2">{error}</p>
                                <Button onClick={() => window.location.reload()} variant="outline">Neu laden</Button>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right: Settings Sidebar */}
                <div className="w-full md:w-[380px] bg-white border-l shadow-xl z-20 overflow-y-auto h-full flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="font-semibold text-lg">Vorschau</h2>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="p-6 space-y-8">

                        {/* Logo Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="font-medium">Dein Firmenlogo</Label>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                            <div
                                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors cursor-pointer relative"
                            >
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={handleLogoUpload}
                                />
                                <Button variant="outline" className="mb-2 bg-white pointer-events-none">
                                    Logo hochladen
                                </Button>
                                <p className="text-xs text-gray-500 pointer-events-none">
                                    oder hier hineinziehen<br />
                                    .jpg, .jpeg, .png (max. 10MB)
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 w-12">Größe</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLogoSize(s => Math.max(10, s - 10))}>-</Button>
                                    <span className="text-sm flex-1 text-center">{logoSize}%</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLogoSize(s => Math.min(100, s + 10))}>+</Button>
                                </div>
                            </div>
                        </div>

                        {/* Color Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="font-medium">Farbe</Label>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                                <div className="relative">
                                    <div
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 cursor-pointer border-2 border-transparent hover:scale-105"
                                        onClick={() => document.getElementById('custom-color-picker')?.click()}
                                    />
                                    <input
                                        type="color"
                                        id="custom-color-picker"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-none"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Layout Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="font-medium">Layout auswählen</Label>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'classic', name: 'Classic' },
                                    { id: 'modern', name: 'Modern' },
                                    { id: 'minimal', name: 'Minimal' },
                                    { id: 'bold', name: 'Bold Header' },
                                ].map((layout) => (
                                    <div
                                        key={layout.id}
                                        className={`aspect-[3/4] border rounded-xl p-3 cursor-pointer transition-all bg-gray-50 flex flex-col gap-2 relative overflow-hidden group ${selectedLayout === layout.id ? 'border-blue-500 ring-2 ring-blue-100 bg-white' : 'hover:border-blue-300'}`}
                                        onClick={() => setSelectedLayout(layout.id as any)}
                                    >
                                        <div className="h-2 w-full bg-gray-200 rounded-full group-hover:bg-blue-100 transition-colors" />
                                        <div className="h-1.5 w-2/3 bg-gray-100 rounded-full" />
                                        <div className="mt-2 space-y-1.5">
                                            <div className="h-1 w-full bg-gray-50" />
                                            <div className="h-1 w-full bg-gray-50" />
                                            <div className="h-1 w-full bg-gray-50" />
                                        </div>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{layout.name}</span>
                                            {selectedLayout === layout.id && <Check className="h-4 w-4 text-blue-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Further Settings */}
                        <div className="space-y-6 pt-4 border-t">
                            <div
                                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                                onClick={() => setIsAdditionalSettingsOpen(!isAdditionalSettingsOpen)}
                            >
                                <Label className="font-medium cursor-pointer">Weitere Einstellungen</Label>
                                {isAdditionalSettingsOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                            </div>

                            {isAdditionalSettingsOpen && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-2">
                                        <Label>Sprache</Label>
                                        <Select defaultValue="de">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="de">Deutsch</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Briefpapier</Label>
                                        <Select defaultValue="none">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Ohne Briefpapier</SelectItem>
                                                <SelectItem value="uploaded">Mein Briefpapier</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="qr-code" className="text-gray-700 cursor-pointer">QR-Code anzeigen</Label>
                                            <Switch
                                                id="qr-code"
                                                checked={showSettings.qrCode}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, qrCode: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="epc-qr" className="text-gray-700 cursor-pointer">EPC-QR-Code (GiroCode)</Label>
                                            <Switch
                                                id="epc-qr"
                                                checked={showSettings.epcQrCode}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, epcQrCode: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="cust-num" className="text-gray-700 cursor-pointer">Kundennummer</Label>
                                            <Switch
                                                id="cust-num"
                                                checked={showSettings.customerNumber}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, customerNumber: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="contact" className="text-gray-700 cursor-pointer">Kontaktperson</Label>
                                            <Switch
                                                id="contact"
                                                checked={showSettings.contactPerson}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, contactPerson: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="vat-item" className="text-gray-700 cursor-pointer">USt. pro Position</Label>
                                            <Switch
                                                id="vat-item"
                                                checked={showSettings.vatPerItem}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, vatPerItem: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="art-num" className="text-gray-700 cursor-pointer">Artikelnummer</Label>
                                            <Switch
                                                id="art-num"
                                                checked={showSettings.articleNumber}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, articleNumber: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="fold-marks" className="text-gray-700 cursor-pointer">Falz- und Lochmarken</Label>
                                            <Switch
                                                id="fold-marks"
                                                checked={showSettings.foldMarks}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, foldMarks: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="pay-terms" className="text-gray-700 cursor-pointer">Zahlungsbedingungen</Label>
                                            <Switch
                                                id="pay-terms"
                                                checked={showSettings.paymentTerms}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, paymentTerms: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="bank-details" className="text-gray-700 cursor-pointer">Bankverbindung</Label>
                                            <Switch
                                                id="bank-details"
                                                checked={showSettings.bankDetails}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, bankDetails: c }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="tax-id" className="text-gray-700 cursor-pointer">Steuernummer/USt-IdNr.</Label>
                                            <Switch
                                                id="tax-id"
                                                checked={showSettings.taxId}
                                                onCheckedChange={(c) => setShowSettings((s: any) => ({ ...s, taxId: c }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
