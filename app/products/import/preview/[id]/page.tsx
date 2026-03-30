'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/components/ui/toast'
import { Loader2, Download, ExternalLink, Globe, LayoutGrid, List, Image as ImageIcon, Search as SearchIcon, Database, Save, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, FileText, Tag, Truck, CreditCard } from "lucide-react"

interface PreviewPageProps {
    params: {
        id: string
    }
}

export default function ImportPreviewPage({ params }: PreviewPageProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [draft, setDraft] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [importing, setImporting] = useState(false)
    const [collections, setCollections] = useState<any[]>([])

    // Load Draft & Collections
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Collections
                const colRes = await fetch('/api/shopify/collections')
                const colData = await colRes.json()
                if (colData.success) setCollections(colData.collections)

                // Load Draft
                const res = await fetch(`/api/products/import/draft/${params.id}`)
                if (!res.ok) throw new Error('Draft not found')

                const data = await res.json()
                const loadedDraft = data.draft
                setDraft(loadedDraft)

                // Check Status & Trigger Processing if needed
                if (loadedDraft.status === 'PENDING') {
                    triggerProcessing(loadedDraft.id)
                }

            } catch (error) {
                console.error(error)
                showToast("Fehler beim Laden der Vorschau", "error")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [params.id])

    const triggerProcessing = async (draftId: string) => {
        setProcessing(true)
        try {
            const res = await fetch(`/api/products/import/draft/${draftId}/process`, {
                method: 'POST'
            })

            if (!res.ok) throw new Error('Processing failed')

            const result = await res.json()
            if (result.success && result.product) {
                // Update local state with processed data
                setDraft(prev => ({
                    ...prev,
                    data: result.product,
                    status: 'READY'
                }))
                showToast("Produkt erfolgreich analysiert", "success")
            }
        } catch (error) {
            console.error("Processing error", error)
            showToast("Fehler bei der Analyse des Produkts", "error")
        } finally {
            setProcessing(false)
        }
    }

    const handleUpdateDraft = async (newData: any, newSettings?: any) => {
        // Optimistic update
        setDraft({ ...draft, data: newData, settings: newSettings || draft.settings })

        // Background save
        try {
            await fetch(`/api/products/import/draft/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: newData, settings: newSettings || draft.settings })
            })
        } catch (e) { console.error('Auto-save failed', e) }
    }

    const handleCommitImport = async () => {
        setImporting(true)
        try {
            const res = await fetch(`/api/products/import/draft/${params.id}/commit`, {
                method: 'POST'
            })
            const data = await res.json()

            if (data.success) {
                showToast("Produkt erfolgreich importiert!", "success")
                // Redirect to store or show success state
                router.push('/products/import?tab=store')
            } else {
                throw new Error(data.error || 'Import failed')
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Import fehlgeschlagen", "error")
        } finally {
            setImporting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto" />
                <p className="text-slate-500 font-medium">Lade Import-Vorschau...</p>
            </div>
        </div>
    )

    if (!draft) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Import fehlgeschlagen</h1>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Der angeforderte Entwurf konnte nicht gefunden werden. Möglicherweise ist beim Erstellen ein Fehler aufgetreten.
                </p>
                <div className="flex justify-center gap-3 mt-8">
                    <Button onClick={() => router.back()} variant="outline" className="w-32">Zurück</Button>
                    <Button onClick={() => router.push('/products/import')} variant="default" className="w-32 bg-violet-600 hover:bg-violet-700">Erneut versuchen</Button>
                </div>
            </div>
        </div>
    )

    // Show Processing State
    if (processing || draft.status === 'PENDING') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-50">
                <div className="relative">
                    <div className="absolute inset-0 bg-violet-100/50 rounded-full animate-ping opacity-20"></div>
                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto relative z-10 text-violet-600">
                        <RefreshCw className="w-10 h-10 animate-spin" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">Analysiere Produkt...</h2>
                    <p className="text-slate-500">Wir extrahieren Daten, Bilder und optimieren den Content mit AI.</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 animate-progress w-full origin-left-right"></div>
                </div>
                <p className="text-xs text-slate-400">Dies kann einige Sekunden dauern</p>
            </div>
        </div>
    )

    const { data: product, settings } = draft
    const multiplier = parseFloat(settings.priceMultiplier || '1')
    const calculatedPrice = (parseFloat(product.price) * multiplier).toFixed(2)

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="text-slate-400">Import /</span>
                                {product?.title ? (product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title) : 'Unbenanntes Produkt'}
                            </h1>
                        </div>
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-600 border-amber-200">
                            Entwurf
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500">
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleCommitImport}
                            disabled={importing}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-200"
                        >
                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Import zu Shopify
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN (Content) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Product Header Card */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex gap-6 p-6">
                                <div className="w-32 h-32 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0].src || product.images[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8" /></div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Titel</Label>
                                        <Input
                                            value={product.title}
                                            onChange={(e) => handleUpdateDraft({ ...product, title: e.target.value })}
                                            className="font-bold text-lg h-10"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vendor</Label>
                                            <Input
                                                value={product.vendor}
                                                onChange={(e) => handleUpdateDraft({ ...product, vendor: e.target.value })}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Produkt Typ</Label>
                                            <Input
                                                value={product.product_type}
                                                onChange={(e) => handleUpdateDraft({ ...product, product_type: e.target.value })}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* TABS */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none h-12 p-0 space-x-6">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3 font-medium text-slate-500 data-[state=active]:text-violet-700">Übersicht</TabsTrigger>
                                <TabsTrigger value="variants" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3 font-medium text-slate-500 data-[state=active]:text-violet-700">Varianten ({product.variants?.length || 0})</TabsTrigger>
                                <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3 font-medium text-slate-500 data-[state=active]:text-violet-700">Medien ({product.images?.length || 0})</TabsTrigger>
                                <TabsTrigger value="seo" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3 font-medium text-slate-500 data-[state=active]:text-violet-700">SEO & Handle</TabsTrigger>
                                <TabsTrigger value="metafields" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3 font-medium text-slate-500 data-[state=active]:text-violet-700">Metafields</TabsTrigger>
                            </TabsList>

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="mt-6 space-y-6">
                                <Card className="border-slate-200">
                                    <CardHeader><CardTitle className="text-base">Beschreibung</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="prose prose-sm max-w-none text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[200px]" dangerouslySetInnerHTML={{ __html: product.description || product.fullDescription }}></div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200">
                                    <CardHeader><CardTitle className="text-base">Preiskalkulation</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <div className="text-center">
                                                <p className="text-xs text-blue-600 uppercase font-bold">Basis Preis</p>
                                                <p className="text-xl font-bold text-blue-900">{product.price} €</p>
                                            </div>
                                            <div className="text-slate-400 font-bold">×</div>
                                            <div className="text-center">
                                                <p className="text-xs text-blue-600 uppercase font-bold">Multiplikator</p>
                                                <p className="text-xl font-bold text-blue-900">{multiplier}</p>
                                            </div>
                                            <div className="text-slate-400 font-bold">=</div>
                                            <div className="text-center">
                                                <p className="text-xs text-blue-600 uppercase font-bold">Shopify Preis</p>
                                                <p className="text-2xl font-black text-violet-600">{calculatedPrice} €</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* VARIANTS TAB */}
                            <TabsContent value="variants" className="mt-6">
                                <Card className="border-slate-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3">Variant</th>
                                                    <th className="px-4 py-3">SKU</th>
                                                    <th className="px-4 py-3 text-right">Basis Preis</th>
                                                    <th className="px-4 py-3 text-right">Final Preis</th>
                                                    <th className="px-4 py-3 text-center">Bestand</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {product.variants?.map((v: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium">{v.title}</td>
                                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.sku || '-'}</td>
                                                        <td className="px-4 py-3 text-right text-slate-500">{v.price} €</td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-900">{(parseFloat(v.price) * multiplier).toFixed(2)} €</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {settings.trackQuantity ? <Badge variant="outline" className="text-green-600 bg-green-50">∞ Auto</Badge> : <span className="text-slate-400">-</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* MEDIA TAB */}
                            <TabsContent value="media" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {product.images?.map((img: any, i: number) => (
                                        <div key={i} className="group relative aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden">
                                            <img src={img.src || img} className="w-full h-full object-contain p-2" />
                                            <div className="absolute top-2 left-2 bg-slate-900/50 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">
                                                {i === 0 ? 'Cover' : `#${i + 1}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* SEO TAB */}
                            <TabsContent value="seo" className="mt-6 space-y-6">
                                <Card className="border-slate-200">
                                    <CardHeader><CardTitle className="text-base">Google Vorschau</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="max-w-[600px] space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs">Fav</div>
                                                <div>
                                                    <div className="text-sm text-slate-800">myshop.com › products › {product.handle}</div>
                                                </div>
                                            </div>
                                            <div className="text-xl text-[#1a0dab] hover:underline cursor-pointer truncate font-medium">
                                                {product.metaTitle || product.title}
                                            </div>
                                            <div className="text-sm text-[#4d5156] leading-snug">
                                                {product.metaDescription || product.description?.replace(/<[^>]*>/g, '').slice(0, 160)}...
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="space-y-4 max-w-2xl">
                                    <div className="space-y-2">
                                        <Label>SEO Title</Label>
                                        <Input value={product.metaTitle || product.title} onChange={(e) => handleUpdateDraft({ ...product, metaTitle: e.target.value })} />
                                        <p className="text-xs text-slate-500 text-right">{(product.metaTitle || product.title).length} / 70</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Meta Description</Label>
                                        <Input value={product.metaDescription || ''} onChange={(e) => handleUpdateDraft({ ...product, metaDescription: e.target.value })} />
                                        <p className="text-xs text-slate-500 text-right">{(product.metaDescription || '').length} / 160</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>URL Handle</Label>
                                        <div className="flex">
                                            <div className="bg-slate-50 border border-r-0 border-slate-200 px-3 flex items-center text-sm text-slate-500 rounded-l-md">/products/</div>
                                            <Input className="rounded-l-none font-mono text-sm" value={product.handle} onChange={(e) => handleUpdateDraft({ ...product, handle: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* METAFIELDS TAB */}
                            <TabsContent value="metafields" className="mt-6">
                                <Card className="border-slate-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-1/3">Key</th>
                                                    <th className="px-4 py-3">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[
                                                    ['source_url', product.sourceUrl],
                                                    ['source_domain', product.sourceDomain],
                                                    ['imported_at', draft.createdAt],
                                                    ['shipping_cost', product.shipping_costs || '0.00'],
                                                    ['mpn', product.mpn || product.google_mpn]
                                                ].map(([k, v], i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{k}</td>
                                                        <td className="px-4 py-3 text-slate-900 truncate max-w-md">{String(v || '-')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* RIGHT COLUMN (Settings) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-slate-200 shadow-lg sticky top-24">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500">Import Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label>Ziel-Kollektion</Label>
                                    <Select
                                        value={settings.collection}
                                        onValueChange={(val) => handleUpdateDraft(product, { ...settings, collection: val })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                                        <SelectContent>
                                            {collections.map((c: any) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label>Preis Multiplikator</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">x</div>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={settings.priceMultiplier}
                                            onChange={(e) => handleUpdateDraft(product, { ...settings, priceMultiplier: e.target.value })}
                                            className="pl-8 font-bold"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {product.price} € ➔ <span className="text-violet-600 font-bold">{(parseFloat(product.price) * parseFloat(settings.priceMultiplier || 1)).toFixed(2)} €</span>
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="cursor-pointer" htmlFor="active">Sofort Aktivieren</Label>
                                        <Switch id="active" checked={settings.isActive} onCheckedChange={(c) => handleUpdateDraft(product, { ...settings, isActive: c })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="cursor-pointer" htmlFor="physical">Physisches Produkt</Label>
                                        <Switch id="physical" checked={settings.isPhysical} onCheckedChange={(c) => handleUpdateDraft(product, { ...settings, isPhysical: c })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="cursor-pointer" htmlFor="stock">Bestand verfolgen</Label>
                                        <Switch id="stock" checked={settings.trackQuantity} onCheckedChange={(c) => handleUpdateDraft(product, { ...settings, trackQuantity: c })} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Zusammenfassung</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Bilder</span>
                                            <span className="font-medium">{product.images?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Varianten</span>
                                            <span className="font-medium">{product.variants?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Status</span>
                                            <span className={`font-bold ${settings.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                                {settings.isActive ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold"
                                    onClick={handleCommitImport}
                                    disabled={importing}
                                >
                                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Import Abschließen
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
