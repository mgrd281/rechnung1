'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Package, ShoppingCart, Search, Filter, Eye, Edit, Trash2, ArrowLeft, Globe, Plus, RefreshCw, Sparkles, ArrowRight, CheckCircle, Info, Settings as SettingsIcon, CheckCircle2, FileText, Tag, Zap, Box, Clock, XCircle, DollarSign, Upload, Home, AlertCircle } from "lucide-react"
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import ProductPreview from '@/components/product-preview'
import { cn } from '@/lib/utils'
import { ProductPreviewModal } from '@/components/products/product-preview-modal'

interface ImportedProduct {
    id: string
    title: string
    variants: any[]
    price?: string
    image?: any
    status: 'imported' | 'pending' | 'failed' | 'active' | 'draft'
    importedAt: string
    sourceUrl?: string
    sourceDomain?: string
    images?: any[]
    handle?: string
}

export default function ProductImportPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState<'import' | 'store'>('import')

    // Import State
    const [urls, setUrls] = useState<string[]>([''])
    const [isImporting, setIsImporting] = useState(false)
    const [importStep, setImportStep] = useState<'idle' | 'validating' | 'importing' | 'complete'>('idle')
    const [errors, setErrors] = useState<{ [key: number]: string }>({})
    const [settings, setSettings] = useState({
        skipValidation: true,
        acceptTerms: true,
        collection: '',
        priceMultiplier: '1',
        isActive: true,
        isPhysical: true,
        chargeTax: true,
        trackQuantity: true
    })

    // Preview State
    const [previewData, setPreviewData] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Collections State
    const [collections, setCollections] = useState<any[]>([])
    const [loadingCollections, setLoadingCollections] = useState(false)

    // Store State
    const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([])
    const [shopDomain, setShopDomain] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [sourceFilter, setSourceFilter] = useState<string>('all')
    const [uniqueSources, setUniqueSources] = useState<string[]>([])

    // Modal State
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // Extract domain from URL or Tag
    const extractDomain = (urlOrTag: string) => {
        if (urlOrTag.startsWith('Source:')) return urlOrTag.replace('Source:', '')
        try {
            const urlObj = new URL(urlOrTag)
            return urlObj.hostname.replace('www.', '')
        } catch {
            return ''
        }
    }

    // Get favicon URL
    const getFaviconUrl = (domain: string) => {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    }

    // Load collections on mount
    useEffect(() => {
        const fetchCollections = async () => {
            setLoadingCollections(true)
            try {
                const response = await fetch('/api/shopify/collections')
                const data = await response.json()
                if (data.success) {
                    setCollections(data.collections)
                }
            } catch (error) {
                console.error('Error loading collections:', error)
            } finally {
                setLoadingCollections(false)
            }
        }
        fetchCollections()
    }, [])

    // Load imported products when tab changes to 'store'
    useEffect(() => {
        if (activeTab === 'store') {
            loadImportedProducts()
        }
    }, [activeTab])

    // Extract unique sources when products change
    useEffect(() => {
        const sources = Array.from(new Set(importedProducts.map(p => p.sourceDomain).filter(Boolean))) as string[]
        setUniqueSources(sources)
    }, [importedProducts])

    const handleUpdateProductInPreview = (index: number, updatedProduct: any) => {
        if (Array.isArray(previewData)) {
            const newData = [...previewData]
            newData[index] = updatedProduct
            setPreviewData(newData)
        } else {
            setPreviewData(updatedProduct)
        }
    }

    const checkDuplicates = (product: any) => {
        if (!product) return false
        return importedProducts.some(p =>
            p.handle === product.handle ||
            (p.variants?.[0]?.sku && p.variants[0].sku === (product.sku || product.variants?.[0]?.sku))
        )
    }

    const loadImportedProducts = async () => {
        try {
            const response = await fetch('/api/products/imported')
            const data = await response.json()
            if (data.success) {
                const productsWithSource = data.products.map((p: any) => {
                    // Extract source from Tags
                    const sourceTag = p.tags?.split(',').find((t: string) => t.trim().startsWith('Source:'))?.trim()
                    const domain = sourceTag ? sourceTag.replace('Source:', '') : (p.sourceDomain || '')

                    return {
                        ...p,
                        image: p.image || (p.images && p.images[0]) || null,
                        sourceUrl: p.sourceUrl || '',
                        sourceDomain: domain,
                        importedAt: p.created_at || p.createdAt || p.importedAt || new Date().toISOString(),
                        status: p.status || 'imported'
                    }
                })
                setImportedProducts(productsWithSource)
                setShopDomain(data.shopDomain)
            }
        } catch (error) {
            console.error('Error loading store:', error)
        }
    }

    const handleAddUrl = () => {
        setUrls([...urls, ''])
    }

    const handleRemoveUrl = (index: number) => {
        if (urls.length > 1) {
            const newUrls = urls.filter((_, i) => i !== index)
            setUrls(newUrls)
        }
    }

    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...urls]
        newUrls[index] = value
        setUrls(newUrls)

        // Clear error when typing
        if (errors[index]) {
            const newErrors = { ...errors }
            delete newErrors[index]
            setErrors(newErrors)
        }
    }

    const validateUrl = (url: string): boolean => {
        if (!url) return false
        try {
            new URL(url)
            return url.includes('.') // Basic check for domain
        } catch {
            return false
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleStartImport()
        }
    }

    // Drag & Drop Handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const text = e.dataTransfer.getData('text')
        if (text && text.startsWith('http')) {
            const existingUrls = urls.filter(u => u.trim())
            if (existingUrls.length > 0 && !existingUrls[existingUrls.length - 1]) {
                handleUrlChange(existingUrls.length - 1, text)
            } else {
                setUrls([...urls, text])
            }
        }
    }, [urls])

    const handleStartImport = async () => {
        // Validation Phase
        const newErrors: { [key: number]: string } = {}
        let hasErrors = false
        const validUrls: string[] = []

        urls.forEach((url, idx) => {
            const trimmed = url.trim()
            if (!trimmed) return // Skip empty lines normally, unless we want to flag them if they are the ONLY input? 

            if (!validateUrl(trimmed)) {
                newErrors[idx] = "Bitte eine gültige URL eingeben (z.B. https://shop.com/produkt)"
                hasErrors = true
            } else {
                validUrls.push(trimmed)
            }
        })

        if (hasErrors) {
            setErrors(newErrors)
            showToast("Bitte überprüfe die rot markierten Felder.", "error")
            return
        }

        if (validUrls.length === 0) {
            // Check if first input is just empty
            if (urls.length === 1 && !urls[0].trim()) {
                setErrors({ 0: "Bitte URL eingeben" })
                return
            }
            return
        }

        if (!settings.acceptTerms) return

        setIsImporting(true)
        setImportStep('validating')
        setPreviewData(null)

        try {
            // For single URL, create draft and redirect
            if (validUrls.length === 1) {
                // 1. Create Draft (PENDING)
                const draftRes = await fetch('/api/products/import/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: validUrls[0],
                        settings: settings
                    })
                })

                if (!draftRes.ok) {
                    const err = await draftRes.json()
                    throw new Error(err.message || err.error || 'Import-Service nicht erreichbar')
                }

                const draftData = await draftRes.json()

                // STRICT CHECK: Only open if we have a valid ID
                if (!draftData.draftId) {
                    throw new Error('Keine Entwurf-ID erhalten. Import abgebrochen.')
                }

                // 2. Open Modal (No Redirect)
                console.log('Draft created:', draftData.draftId)
                setCurrentDraftId(draftData.draftId)
                setIsPreviewOpen(true)
                return

            } else {
                // Bulk import - Keep existing logic or refactor later
                // For now, let's keep it as is (client-side scraping) to avoid breaking it,
                // OR we could loop create drafts?
                // The task was specific to "Redirect -> Draft not found". Bulk doesn't redirect?
                // If bulk is used, it stays on page. So we only touch Single URL flow.

                // ... keep existing bulk logic ...
                setImportStep('importing')
                setIsLoadingPreview(true)
                const previews = []

                for (const url of validUrls) {
                    // ... existing bulk scraping ...
                    try {
                        const scrapeRes = await fetch('/api/products/import/external', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url })
                        })

                        if (!scrapeRes.ok) continue
                        const scrapeData = await scrapeRes.json()
                        const product = scrapeData.product
                        product.sourceUrl = url
                        product.sourceDomain = extractDomain(url)

                        previews.push(product)
                    } catch (error) {
                        console.error(`Failed to scrape ${url}:`, error)
                    }
                }

                setPreviewData(previews)
                setImportStep('complete')
                setIsLoadingPreview(false)
                showToast(`${previews.length} Produkte zum Import bereit`, "success")
            }
        } catch (error) {
            console.error('Import error:', error)
            showToast(error instanceof Error ? error.message : 'Import fehlgeschlagen', "error")
            setImportStep('idle')
        } finally {
            setIsImporting(false)
            setIsLoadingPreview(false)
        }
    }

    const handleSaveProducts = async () => {
        if (!previewData) return

        const productsToSave = Array.isArray(previewData) ? previewData : [previewData]

        // Final sanity check for warnings
        const productsWithWarnings = productsToSave.filter(p => {
            return !p.images?.length || (!p.sku && !p.google_mpn) || parseFloat(p.price) <= 0
        })

        if (productsWithWarnings.length > 0) {
            const proceed = window.confirm(`${productsWithWarnings.length} Produkte haben Warnungen (fehlende Bilder oder SKU). Trotzdem importieren?`)
            if (!proceed) return
        }

        setIsSaving(true)
        try {
            const productsToSave = Array.isArray(previewData) ? previewData : [previewData]

            for (const p of productsToSave) {
                await fetch('/api/products/import/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product: p,
                        settings: settings
                    })
                })
            }

            showToast("Produkt erfolgreich importiert!", "success")

            // Redirect to digital products section with import context
            const importId = `imp_prod_${Date.now()}`
            const count = Array.isArray(previewData) ? previewData.length : 1

            setTimeout(() => {
                setActiveTab('store')
                loadImportedProducts()
            }, 1200)

            setPreviewData(null)
            setUrls([''])
            setImportStep('idle')

        } catch (error) {
            console.error('Save error:', error)
            showToast(error instanceof Error ? error.message : 'Speichern fehlgeschlagen', "error")
        } finally {
            setIsSaving(false)
        }
    }

    // Filter products
    const filteredProducts = importedProducts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesSource = sourceFilter === 'all' || p.sourceDomain === sourceFilter
        return matchesSearch && matchesSource
    })

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-8 pb-32">


            <ProductPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                draftId={currentDraftId}
                onSuccess={() => {
                    setActiveTab('store')
                    loadImportedProducts()
                }}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-9 w-9 rounded-full border-slate-200 bg-white/50 hover:bg-slate-50 shadow-sm transition-all"
                        title="Zurück"
                        aria-label="Zurück"
                    >
                        <ArrowLeft className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
                    </Button>
                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full border-slate-200 bg-white/50 hover:bg-slate-50 shadow-sm transition-all"
                            title="Dashboard"
                            aria-label="Dashboard"
                        >
                            <Home className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
                        </Button>
                    </Link>
                    <div className="ml-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Importer</h1>
                        <p className="text-sm text-slate-500">Importieren Sie Produkte von jeder URL – Powered by AI</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'import' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Import
                    </button>
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'store' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Store <Badge variant="secondary" className="ml-1 h-5 px-1.5">{importedProducts.length}</Badge>
                    </button>
                </div>
            </div>

            {activeTab === 'import' ? (
                // IMPORT TAB CONTENT
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input & Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* URL Inputs */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-50'}`}></div>
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">1</div>
                                    <CardTitle className="text-lg">Product URLs</CardTitle>
                                </div>
                                <CardDescription>URLs hinzufügen oder per Drag & Drop einfügen</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {/* Drag Zone */}
                                {isDragging && (
                                    <div className="border-2 border-dashed border-violet-500 bg-violet-500/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 mb-4">
                                        <Upload className="h-12 w-12 text-violet-400 animate-bounce" />
                                        <p className="text-violet-300 font-medium">URL hier ablegen</p>
                                    </div>
                                )}

                                {urls.map((urlItem, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    value={urlItem}
                                                    onChange={(e) => handleUrlChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                                    placeholder="https://shop.example.com/product/item"
                                                    className={`pl-10 h-11 ${errors[index] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {urls.length > 1 && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveUrl(index)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        {errors[index] && (
                                            <p className="text-red-500 text-xs ml-1 font-medium animate-in slide-in-from-top-1">
                                                {errors[index]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                <Button variant="outline" onClick={handleAddUrl} className="w-full border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400">
                                    <Plus className="h-4 w-4 mr-2" /> Weitere URL hinzufügen
                                </Button>

                                <div className="pt-4 flex justify-end">
                                    <Button
                                        size="lg"
                                        onClick={handleStartImport}
                                        className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 shadow-lg shadow-violet-200"
                                        disabled={isImporting || urls.every(u => !u.trim())}
                                    >
                                        {isImporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {isImporting ? 'Analysing...' : 'Import Starten'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Section */}
                        {
                            isImporting && (
                                <div className="space-y-4">
                                    {/* Skeletons or Loading State */}
                                    <div className="h-48 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">
                                        Thinking...
                                    </div>
                                </div>
                            )
                        }

                        {
                            previewData && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-slate-900">Preview Results</h3>
                                            {Array.isArray(previewData) && (
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 font-bold">
                                                        {previewData.length} Ready
                                                    </Badge>
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-bold">
                                                        0 Warnings
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {Array.isArray(previewData) ? (
                                            <div className="space-y-8">
                                                {previewData.map((product: any, idx: number) => (
                                                    <div key={idx} className="space-y-4">
                                                        <div className="flex items-center gap-2 px-2">
                                                            <div className="h-6 w-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Produkt {idx + 1}</span>
                                                        </div>
                                                        <ProductPreview
                                                            product={product}
                                                            settings={settings}
                                                            collections={collections}
                                                            onUpdate={(updated) => handleUpdateProductInPreview(idx, updated)}
                                                        />
                                                        {checkDuplicates(product) && (
                                                            <div className="mx-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <span>Achtung: Dieses Produkt scheint bereits im Store zu existieren (gleicher Handle oder SKU).</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <ProductPreview
                                                    product={previewData}
                                                    settings={settings}
                                                    collections={collections}
                                                    onUpdate={(updated) => handleUpdateProductInPreview(-1, updated)}
                                                />
                                                {checkDuplicates(previewData) && (
                                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span>Achtung: Dieses Produkt scheint bereits im Store zu existieren (gleicher Handle oder SKU).</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-center">
                                        <Button size="lg" onClick={handleSaveProducts} disabled={isSaving} className="shadow-xl bg-slate-900 text-white hover:bg-slate-800 px-8">
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                            Import {Array.isArray(previewData) ? previewData.length : 1} Products to Shopify
                                        </Button>
                                    </div>
                                </div>
                            )
                        }
                    </div >

                    {/* Right Column: Settings */}
                    < div className="space-y-6" >
                        <Card className="border-slate-200 shadow-sm sticky top-6">
                            <CardHeader className="py-4 border-b border-slate-100">
                                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Import Einstellungen</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-slate-600 uppercase">Kollektion</Label>
                                    <Select value={settings.collection} onValueChange={(val) => setSettings({ ...settings, collection: val })}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Kollektion wählen..." /></SelectTrigger>
                                        <SelectContent>
                                            {collections.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-slate-600 uppercase">Preis-Multiplikator</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">x</div>
                                        <Input type="number" step="0.1" value={settings.priceMultiplier} onChange={(e) => setSettings({ ...settings, priceMultiplier: e.target.value })} className="pl-8 bg-slate-50" />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between"><Label>Sofort Aktivieren</Label><Checkbox checked={settings.isActive} onCheckedChange={(c: boolean) => setSettings({ ...settings, isActive: !!c })} /></div>
                                    <div className="flex items-center justify-between"><Label>Physisches Produkt</Label><Checkbox checked={settings.isPhysical} onCheckedChange={(c: boolean) => setSettings({ ...settings, isPhysical: !!c })} /></div>
                                    <div className="flex items-center justify-between"><Label>Bestandsverfolgung</Label><Checkbox checked={settings.trackQuantity} onCheckedChange={(c: boolean) => setSettings({ ...settings, trackQuantity: !!c })} /></div>
                                    <div className="flex items-center justify-between"><Label>Steuer erheben</Label><Checkbox checked={settings.chargeTax} onCheckedChange={(c: boolean) => setSettings({ ...settings, chargeTax: !!c })} /></div>
                                    <div className="flex items-center justify-between"><Label>Terms akzeptieren</Label><Checkbox checked={settings.acceptTerms} onCheckedChange={(c: boolean) => setSettings({ ...settings, acceptTerms: !!c })} /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div >
                </div >
            ) : (
                // STORE TAB CONTENT
                <div className="space-y-6">
                    {/* Filters Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Produkte suchen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 border-slate-200"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="w-[200px] border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-slate-500" />
                                        <SelectValue placeholder="Alle Quellen" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Quellen</SelectItem>
                                    {uniqueSources.map(source => (
                                        <SelectItem key={source} value={source}>
                                            <div className="flex items-center gap-2">
                                                <img src={getFaviconUrl(source)} className="w-4 h-4 rounded-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                {source}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={loadImportedProducts} className="border-slate-200"><RefreshCw className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group relative">
                                <Card className="overflow-hidden border-slate-200 bg-white hover:border-violet-400 hover:shadow-2xl hover:shadow-violet-200/40 transition-all duration-500 rounded-2xl group-hover:-translate-y-1">
                                    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
                                        {product?.image ? (
                                            <img src={product.image.src} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-300 bg-slate-50"><Box className="h-10 w-10 opacity-20" /></div>
                                        )}

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <Badge className={cn(
                                                "backdrop-blur-md shadow-sm text-[10px] font-black uppercase tracking-wider border-0 px-2",
                                                product.status === 'active' ? "bg-emerald-500/90 text-white" : "bg-slate-900/80 text-white"
                                            )}>
                                                {product.status || 'imported'}
                                            </Badge>
                                        </div>

                                        {/* Quick Actions Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center gap-3">
                                            <Link href={`https://${shopDomain}/products/${product.handle}`} target="_blank">
                                                <Button size="icon" className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-violet-600 hover:text-white shadow-xl hover:scale-110 transition-all"><Eye className="h-5 w-5" /></Button>
                                            </Link>
                                            <Link href={`https://${shopDomain}/admin/products/${product.id}`} target="_blank">
                                                <Button size="icon" className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-violet-600 hover:text-white shadow-xl hover:scale-110 transition-all"><Edit className="h-5 w-5" /></Button>
                                            </Link>
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="mb-3">
                                            {product.sourceDomain && (
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-widest" title={product.sourceUrl || product.sourceDomain}>
                                                    <img src={getFaviconUrl(product.sourceDomain)} className="w-3.5 h-3.5 rounded-sm grayscale group-hover:grayscale-0 transition-all" alt="" />
                                                    <span className="truncate max-w-[120px]">{product.sourceDomain}</span>
                                                </div>
                                            )}
                                            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-violet-600 transition-colors" title={product.title}>{product.title}</h3>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <span className="text-base font-black text-slate-900">{product.variants?.[0]?.price || '-'} <span className="text-xs font-normal text-slate-400 italic">€</span></span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase">{new Date(product.importedAt).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }
        </div >
    )
}
