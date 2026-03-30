'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, Edit3, Image as ImageIcon,
    Sparkles, Save, Check, ChevronRight, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SeoProductScore } from '@/types/seo-types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

interface SeoProductTableProps {
    products: SeoProductScore[]
    onUpdateProduct: (productId: string, data: any) => void
}

export function SeoProductTable({ products, onUpdateProduct }: SeoProductTableProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<SeoProductScore | null>(null)

    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.handle.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        className="pl-10 h-12 bg-white border-slate-100 rounded-2xl text-xs font-bold shadow-sm"
                        placeholder="Produkt oder Kategorie suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Badge variant="outline" className="h-12 px-6 border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest text-slate-500 rounded-2xl shadow-sm">
                    {filtered.length} Items analysiert
                </Badge>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Name / Item</th>
                                <th className="px-4 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">SEO Score</th>
                                <th className="px-4 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Titel-Status</th>
                                <th className="px-4 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Bilder</th>
                                <th className="px-4 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Schema</th>
                                <th className="px-8 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors cursor-pointer" onClick={() => setSelectedProduct(item)}>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight italic">{item.title}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.handle}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "text-sm font-black",
                                                item.score > 80 ? "text-emerald-600" : item.score > 50 ? "text-amber-600" : "text-red-500"
                                            )}>{item.score}</span>
                                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    item.score > 80 ? "bg-emerald-500" : item.score > 50 ? "bg-amber-500" : "bg-red-500"
                                                )} style={{ width: `${item.score}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] border-none font-black uppercase tracking-widest h-6 px-3",
                                            item.titleOptimal ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"
                                        )}>
                                            {item.titleOptimal ? 'Optimal' : 'Zu Kurz'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-6">
                                        {item.missingAlts > 0 ? (
                                            <Badge className="bg-amber-50 text-amber-600 border-none text-[9px] font-black uppercase h-6 px-3">
                                                {item.missingAlts} Fehlende Alts
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                <Check className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase">Ready</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-6">
                                        <Badge className={cn(
                                            "text-[9px] font-black uppercase border-none h-6 px-3",
                                            item.hasSchema ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {item.hasSchema ? 'Schema Active' : 'No Schema'}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-transparent group-hover:border-emerald-100 transition-all">
                                            Analysieren <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* SEO Editor Drawer */}
            <Sheet open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <SheetContent className="w-full sm:max-w-2xl p-0 border-none shadow-2xl bg-white flex flex-col">
                    <div className="bg-slate-900 text-white p-10 flex-shrink-0">
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest mb-6 px-3 h-6">Live Shopify Sync</Badge>
                        <SheetTitle className="text-3xl font-black uppercase tracking-tight text-white italic">{selectedProduct?.title}</SheetTitle>
                        <SheetDescription className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> High Performance Analysis
                        </SheetDescription>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-12 pb-20 scrollbar-hide">
                        {/* Title Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> Google SEO Titel
                                </label>
                                <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-full", (selectedProduct?.title.length || 0) < 50 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                                    {selectedProduct?.title.length} / 60 Zeichen
                                </span>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                <Input
                                    className="h-14 bg-white border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-slate-900/5 transition-all uppercase italic"
                                    defaultValue={selectedProduct?.title}
                                />
                                <Button className="w-full h-14 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200">
                                    <Sparkles className="w-4 h-4 mr-2 text-emerald-400" /> SEO TITEL MIT KI OPTIMIEREN
                                </Button>
                            </div>
                        </div>

                        {/* Google Preview */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Google Suchergebnis Preview</label>
                            <div className="p-8 bg-white rounded-[2rem] border border-slate-100 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-blue-700 text-xl font-bold hover:underline cursor-pointer">
                                    {selectedProduct?.title}
                                </p>
                                <p className="text-emerald-800 text-[11px] font-medium italic">
                                    https://ihr-shop.de{selectedProduct?.handle}
                                </p>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                                    {selectedProduct?.title} online kaufen. Höchste Qualität, schneller Versand. Jetzt in unserem Shopify Store entdecken!
                                </p>
                            </div>
                        </div>

                        {/* Image Alts */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3.5 h-3.5" /> Bild-Optimierung (ALT-Texte)
                            </label>
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-slate-100/30 transition-colors">
                                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            <ImageIcon className="w-7 h-7 text-slate-300" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-400">Alt-Beschreibung</label>
                                            <Input
                                                className="h-10 bg-white border-slate-100 rounded-xl text-xs font-bold"
                                                placeholder="z.B. Elegante Ledertasche Schwarz Profilansicht"
                                            />
                                        </div>
                                        <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl border-slate-200 text-emerald-600 bg-white hover:bg-emerald-50 hover:border-emerald-100 transition-colors mt-5">
                                            <Sparkles className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-50 bg-white sticky bottom-0 flex gap-4 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                        <Button variant="outline" className="flex-1 h-14 border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-50">
                            ALS DRAFT SPEICHERN
                        </Button>
                        <Button className="flex-1 h-14 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">
                            <Save className="w-4 h-4 mr-2" /> JETZT AKTUALISIEREN
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
