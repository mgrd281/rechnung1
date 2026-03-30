'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Box,
    Tag,
    Image as ImageIcon,
    Globe,
    Search,
    CircleAlert,
    CircleCheck2,
    Info,
    Edit,
    Database,
    FileText,
    Zap,
    ShoppingBag,
    ArrowRight,
    ExternalLink,
    ChevronRight,
    Calculator,
    Layout,
    Type,
    User,
    Hash,
    Activity
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { transformToShopifyProduct } from '@/lib/shopify-transform'

interface ProductPreviewProps {
    product: any
    settings: {
        collection: string
        priceMultiplier: string
        isActive: boolean
        chargeTax: boolean
        trackQuantity: boolean
        isPhysical: boolean
    }
    collections: any[]
    onUpdate?: (updatedProduct: any) => void
}

export default function ProductPreview({ product, settings, collections, onUpdate }: ProductPreviewProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editedProduct, setEditedProduct] = useState({ ...product })

    // Use the central transformation logic
    const shopifyData = transformToShopifyProduct(product, { ...settings, collections })
    const preview = shopifyData._preview

    const handleUpdate = () => {
        if (onUpdate) onUpdate(editedProduct)
        setIsEditDialogOpen(false)
    }

    // Validation & Warnings
    const warnings: string[] = []
    if (!product.images || product.images.length === 0) warnings.push("Keine Bilder gefunden")
    if (!product.sku && !product.google_mpn) warnings.push("Fehlende SKU / MPN (Empfohlen)")
    if (parseFloat(shopifyData.variants[0].price) <= 0) warnings.push("Kritisch: Ungültiger Preis (0.00)")
    if (!product.variants || product.variants.length === 0) warnings.push("Hinweis: Keine Varianten erkannt (Standard wird erstellt)")

    // Duplicate detection (handled in parent but we display it here too if needed)

    return (
        <Card className="border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1">{shopifyData.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500 font-medium">{shopifyData.vendor}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-violet-600 font-bold">{shopifyData.product_type}</span>
                                <Badge variant="outline" className="ml-2 text-[10px] uppercase font-bold text-slate-400 border-slate-200">
                                    {shopifyData.status}
                                </Badge>
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 gap-2 border-slate-200 hover:bg-slate-50 transition-all font-semibold"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            <Edit className="h-3.5 w-3.5" /> Bearbeiten
                        </Button>
                    </div>
                </div>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Produkt bearbeiten</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Produkttitel</Label>
                                <Input value={editedProduct.title} onChange={(e) => setEditedProduct({ ...editedProduct, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hersteller (Vendor)</Label>
                                    <Input value={editedProduct.vendor} onChange={(e) => setEditedProduct({ ...editedProduct, vendor: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Typ</Label>
                                    <Input value={editedProduct.product_type} onChange={(e) => setEditedProduct({ ...editedProduct, product_type: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Basispreis</Label>
                                <Input type="number" value={editedProduct.price} onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Abbrechen</Button>
                            <Button onClick={handleUpdate} className="bg-violet-600 text-white hover:bg-violet-700">Speichern</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                        <CircleAlert className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-bold mb-1">Hinweise/Warnungen vor dem Import:</p>
                            <ul className="list-disc list-inside space-y-0.5 opacity-90">
                                {warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </CardHeader>

            <Tabs defaultValue="overview" className="w-full">
                <div className="px-6 bg-slate-50/30 border-b border-slate-100">
                    <TabsList className="bg-transparent h-14 p-0 gap-8 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Übersicht', icon: Box },
                            { id: 'variants', label: 'Varianten', icon: Zap },
                            { id: 'media', label: 'Medien', icon: ImageIcon },
                            { id: 'seo', label: 'SEO', icon: Search },
                            { id: 'metafields', label: 'Metafields', icon: Database },
                            { id: 'mapping', label: 'Mapping', icon: ChevronRight }
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-violet-600 data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none h-full px-0 text-slate-500 font-bold text-xs uppercase tracking-widest gap-2 flex-shrink-0"
                            >
                                <tab.icon className="h-4 w-4" /> {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <CardContent className="p-6">
                    {/* OVERVIEW CONTENT */}
                    <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-violet-500" /> Beschreibung (HTML Preview)
                                    </h4>
                                    <div className="prose prose-sm max-w-none text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-[400px] overflow-y-auto leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: shopifyData.body_html }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Handle / Slug</p>
                                        <p className="text-sm font-mono text-slate-700 truncate">{shopifyData.handle || 'auto-generated'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gezielte Kollektion</p>
                                        <p className="text-sm font-bold text-violet-600">{preview.collectionTitle}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-violet-600 text-white rounded-2xl shadow-xl shadow-violet-200 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <Calculator className="h-24 w-24 -mr-8 -mt-8" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-4">Shopify Preisberechnung</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center opacity-90 text-xs">
                                            <span>Basispreis</span>
                                            <span>{product.price} {product.currency || 'EUR'}</span>
                                        </div>
                                        <div className="flex justify-between items-center opacity-90 text-xs">
                                            <span>Multiplier</span>
                                            <span>× {settings.priceMultiplier}</span>
                                        </div>
                                        <div className="h-px bg-white/20 my-2" />
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold">Finaler Preis</span>
                                            <span className="text-3xl font-black">{shopifyData.variants[0].price} <span className="text-sm opacity-80">{product.currency || 'EUR'}</span></span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 opacity-80 text-[10px] font-bold italic">
                                            <span>Vergleichspreis (ca.)</span>
                                            <span>{shopifyData.variants[0].compare_at_price} {product.currency || 'EUR'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daraus resultierende Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {shopifyData.tags.split(',').map((tag: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 border-0 hover:bg-slate-200 px-2.5 py-1">
                                                {tag.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* VARIANTS CONTENT */}
                    <TabsContent value="variants" className="mt-0 animate-in fade-in duration-300">
                        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-slate-200">
                                        <TableHead className="w-[80px]">Vorschau</TableHead>
                                        <TableHead>Optionen / Titel</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode / EAN</TableHead>
                                        <TableHead className="text-right">Preis</TableHead>
                                        <TableHead className="text-right">Inventar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shopifyData.variants.map((variant: any, idx: number) => (
                                        <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                                            <TableCell>
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {variant.image ? <img src={variant.image} className="h-full w-full object-cover" /> : <Box className="h-5 w-5 text-slate-300" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{variant.title}</p>
                                                    <div className="flex gap-1 mt-0.5">
                                                        {variant.option1 && <Badge variant="outline" className="text-[9px] px-1 h-3.5">{variant.option1}</Badge>}
                                                        {variant.option2 && <Badge variant="outline" className="text-[9px] px-1 h-3.5">{variant.option2}</Badge>}
                                                        {variant.option3 && <Badge variant="outline" className="text-[9px] px-1 h-3.5">{variant.option3}</Badge>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-600">{variant.sku || '-'}</TableCell>
                                            <TableCell className="text-xs font-mono text-slate-600">{variant.barcode || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{variant.price} {product.currency || 'EUR'}</p>
                                                    <p className="text-[10px] text-slate-400 line-through">{variant.compare_at_price}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 text-xs">
                                                {variant.inventory_management === 'shopify' ? `${variant.inventory_quantity} Stk.` : 'Keine Verfolgung'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 italic flex items-center gap-2">
                            <Info className="h-3 w-3" /> Versandprofil: {settings.isPhysical ? 'Physisch' : 'Digital'} • Steuern: {settings.chargeTax ? 'Aktiv' : 'Inaktiv'}
                        </p>
                    </TabsContent>

                    {/* MEDIA CONTENT */}
                    <TabsContent value="media" className="mt-0 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {shopifyData.images.map((img: any, i: number) => (
                                <div key={i} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:border-violet-400 transition-all cursor-pointer">
                                    <img src={img.src} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-900 shadow-lg">#{i + 1}</div>
                                    </div>
                                    {i === 0 && <Badge className="absolute top-2 left-2 bg-violet-600 text-white border-0 shadow-md">Featured</Badge>}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-slate-100 text-center">
                                        <p className="text-[9px] text-slate-700 font-bold uppercase truncate px-1">{img.alt}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* SEO CONTENT */}
                    <TabsContent value="seo" className="mt-0 animate-in fade-in duration-300">
                        <div className="max-w-2xl space-y-8">
                            <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/60 shadow-inner">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Globe className="h-4 w-4" /> Google Search Preview
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer truncate">{preview.metaTitle}</p>
                                    <p className="text-[#006621] text-sm mb-1 truncate">https://your-store.myshopify.com/products/{shopifyData.handle || 'auto-handle'}</p>
                                    <p className="text-[#4d5156] text-sm line-clamp-2 leading-relaxed">
                                        {preview.metaDescription}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meta Title</p>
                                        <div className="text-sm font-semibold text-slate-800 leading-tight p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            {preview.metaTitle}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meta Description</p>
                                        <div className="text-sm text-slate-600 leading-relaxed p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            {preview.metaDescription}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* METAFIELDS CONTENT */}
                    <TabsContent value="metafields" className="mt-0 animate-in fade-in duration-300">
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-slate-200">
                                        <TableHead className="w-[180px]">Key (Namespace: custom)</TableHead>
                                        <TableHead>Finaler Wert / JSON</TableHead>
                                        <TableHead className="w-[140px]">Shopify-Typ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shopifyData.metafields.map((meta, i) => (
                                        <TableRow key={i} className="border-slate-100 divide-x divide-slate-50">
                                            <TableCell className="font-mono text-[10px] font-bold text-slate-500">{meta.namespace}.{meta.key}</TableCell>
                                            <TableCell className="text-xs text-slate-600">
                                                {meta.type === 'rich_text_field' ? (
                                                    <div className="max-h-24 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] whitespace-pre-wrap">
                                                        {meta.value}
                                                    </div>
                                                ) : (
                                                    <span className="truncate block max-w-md">{meta.value}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200 uppercase">{meta.type}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* MAPPING CONTENT */}
                    <TabsContent value="mapping" className="mt-0 animate-in fade-in duration-300">
                        <div className="space-y-4 max-w-xl">
                            <div className="grid grid-cols-7 items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                                <div className="col-span-3">Gescrater Wert / Feld</div>
                                <div className="col-span-1 flex justify-center"><ArrowRight className="h-3 w-3" /></div>
                                <div className="col-span-3">Shopify Eigenschaft</div>
                            </div>

                            {[
                                { source: product.title, label: 'Titel', target: 'product.title', icon: Type },
                                { source: product.price, label: 'Preis', target: 'variant.price', icon: Calculator },
                                { source: product.vendor, label: 'Vendor', target: 'product.vendor', icon: User },
                                { source: product.sku, label: 'SKU', target: 'variant.sku', icon: Hash },
                                { source: `Array(${product.images?.length || 0})`, label: 'Images', target: 'product.images[]', icon: ImageIcon },
                                { source: `Array(${shopifyData.variants.length})`, label: 'Variants', target: 'product.variants[]', icon: Zap },
                                { source: 'Dynamic', label: 'Meta Tags', target: 'global.meta_tags', icon: Search }
                            ].map((m, i) => (
                                <div key={i} className="grid grid-cols-7 items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-violet-200 hover:bg-white transition-all shadow-sm">
                                    <div className="col-span-3 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{m.label}</span>
                                        <div className="flex items-center gap-2">
                                            <m.icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-500" />
                                            <span className="text-xs font-bold text-slate-600 truncate">{m.source || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <ArrowRight className="h-4 w-4 text-slate-300 animate-pulse" />
                                    </div>
                                    <div className="col-span-3">
                                        <Badge className="bg-slate-900 text-white border-0 font-bold font-mono text-[9px] px-2 py-0.5">{m.target}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </CardContent>
            </Tabs>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 flex items-center gap-2 font-medium">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" /> Live Shopify-Payload bereit zur Übertragung.
                </p>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 font-bold text-[10px] uppercase flex items-center gap-1.5"
                        onClick={() => {
                            console.log('Shopify Payload:', shopifyData);
                            alert('Payload wurde in die Konsole geloggt.');
                        }}>
                        Live JSON <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
