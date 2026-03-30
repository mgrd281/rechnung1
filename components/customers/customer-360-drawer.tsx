'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Mail, Phone, MapPin, Tag as TagIcon, Sparkles,
    ShoppingCart, MousePointer2, Brain, History,
    TrendingUp, ExternalLink, ArrowRight, UserMinus, ShieldCheck, Package, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type ProfileTab = 'overview' | 'orders' | 'behavior' | 'ai';

export function Customer360Drawer({ customer, open, onOpenChange }: any) {
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
    if (!customer) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[850px] border-l-0 p-0 overflow-hidden flex flex-col bg-white">
                {/* Header Section - Premium Dark */}
                <div className="bg-slate-900 text-white p-10 flex-shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Users className="w-64 h-64 text-white" />
                    </div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex gap-6 items-center">
                            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-3xl font-black border border-white/10 shadow-2xl uppercase italic">
                                {customer.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight italic">{customer.name}</h2>
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                        <Mail className="w-3.5 h-3.5" /> {customer.email || 'Keine E-Mail'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge className={cn("border-none text-[9px] font-black uppercase tracking-widest px-3 h-6",
                                            customer.segment === 'VIP' ? 'bg-amber-100 text-amber-600' :
                                                customer.segment === 'Neukunde' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                                        )}>{customer.segment}</Badge>
                                        {customer.isRefunded && <Badge className="bg-red-500/20 text-red-400 border-none text-[9px] font-black uppercase px-3 h-6">Rückerstattung</Badge>}
                                        {customer.isCancelled && <Badge className="bg-amber-500/20 text-amber-400 border-none text-[9px] font-black uppercase px-3 h-6">Storniert</Badge>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kundenwert (Netto)</p>
                            <h3 className="text-3xl font-black text-emerald-400">
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.revenue)}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl w-fit relative z-10">
                        {[
                            { id: 'overview', label: 'Übersicht', icon: History },
                            { id: 'orders', label: 'Bestellungen', icon: ShoppingCart },
                            { id: 'behavior', label: 'Verhalten', icon: MousePointer2 },
                            { id: 'ai', label: 'KI-Prognose', icon: Brain }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === t.id ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <t.icon className="w-3.5 h-3.5" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 pb-32 scrollbar-hide">
                    {activeTab === 'overview' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Gültige Käufe</p>
                                    <p className="text-2xl font-black">{customer.orders}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Rückerstattet</p>
                                    <p className="text-2xl font-black text-red-500">€{customer.refundedAmount?.toFixed(2) || '0,00'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Kunden seit</p>
                                    <p className="text-xl font-black">{customer.createdAt ? format(new Date(customer.createdAt), 'MMMM yyyy', { locale: de }) : 'Unbekannt'}</p>
                                </div>
                            </div>

                            {/* Identity Grid */}
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 italic">
                                        <MapPin className="w-4 h-4 text-blue-600" /> Kontakt- & Adressdaten
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100/50">
                                            <div className="text-xs font-bold leading-relaxed text-slate-700">
                                                <p className="font-black text-slate-900 mb-1">Hausanschrift</p>
                                                {customer.address || 'Keine Adresse hinterlegt'}<br />
                                                {customer.zipCode} {customer.city}<br />
                                                {customer.country || 'Deutschland'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 italic">
                                        <TagIcon className="w-4 h-4 text-violet-600" /> CRM Segmente & Tags
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100/50">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[9px] font-bold h-7 px-3 uppercase">{customer.source === 'shopify' ? 'Shopify Kunde' : 'Direktkunde'}</Badge>
                                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[9px] font-bold h-7 px-3 uppercase">{customer.segment}</Badge>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase mt-4">Kunden-ID: {customer.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 italic">
                                <History className="w-4 h-4 text-blue-600" /> Transaktionshistorie
                            </h3>
                            <div className="space-y-4">
                                {customer.orders > 0 ? (
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
                                                <Package className="w-6 h-6 text-slate-900" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase italic tracking-tight text-slate-900">Letzte Bestellung</p>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                    {customer.lastOrderDate ? format(new Date(customer.lastOrderDate), 'dd. MMMM yyyy', { locale: de }) : 'Datum unbekannt'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900">
                                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.revenue)}
                                            </p>
                                            <Badge className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase border-none h-6 px-3 mt-1">Erfolgreich bezahlt</Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-black uppercase text-slate-400 italic">Keine validen Bestellungen gefunden</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'behavior' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-8">
                                <Card className="p-8 bg-slate-900 text-white border-none rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                    <MousePointer2 className="w-10 h-10 text-blue-400 mb-6" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Besuchsverhalten</h4>
                                    <p className="text-4xl font-black">24</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-6 italic tracking-widest">Seitenaufrufe (Letzte 30T)</p>
                                </Card>
                                <Card className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                                    <ShoppingCart className="w-10 h-10 text-slate-900 mb-6" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Warenkorb-Abbrüche</h4>
                                    <p className="text-4xl font-black">2</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-6 italic tracking-widest">Nicht abgeschlossene Käufe</p>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-10 bg-gradient-to-br from-violet-600 to-indigo-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <Sparkles className="absolute top-10 right-10 w-24 h-24 text-white/5" />
                                <div className="z-10 relative">
                                    <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-black uppercase tracking-widest mb-8">KI-Analysesystem</Badge>
                                    <h4 className="text-2xl font-black uppercase tracking-tight mb-4 italic">Kaufwahrscheinlichkeit: {customer.revenue > 300 ? 'Sehr Hoch' : 'Hoch'}</h4>
                                    <p className="text-sm text-indigo-100/80 leading-relaxed mb-10 max-w-sm">
                                        Die KI empfiehlt eine persönliche Nachricht mit einem Treuerabatt, da der Kunde typischerweise alle 45 Tage bestellt.
                                    </p>
                                    <Button className="w-full h-14 bg-white text-indigo-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                                        Persönlichen Deal generieren
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-8 border-t bg-white/80 backdrop-blur-md flex items-center justify-between gap-6 z-50">
                    <div className="flex gap-4 flex-1">
                        <Button variant="outline" className="h-14 flex-1 rounded-2xl border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                            E-Mail senden
                        </Button>
                        <Button className="h-14 flex-1 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-200 transition-all italic">
                            KI-Empfehlung nutzen
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-14 w-14 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-6 h-6" />
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

import { Users } from 'lucide-react'
