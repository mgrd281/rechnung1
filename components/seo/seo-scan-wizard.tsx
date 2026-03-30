'use client'

import { useState } from 'react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Search, Rocket, Globe, Zap,
    Layers, CheckCircle2, Loader2, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SeoScanOptions, SeoScan } from '@/types/seo-types'

interface SeoScanWizardProps {
    isOpen: boolean
    onClose: () => void
    onStartScan: (options: SeoScanOptions) => void
    scanProgress?: SeoScan
}

export function SeoScanWizard({ isOpen, onClose, onStartScan, scanProgress }: SeoScanWizardProps) {
    const [step, setStep] = useState(1)
    const [options, setOptions] = useState<SeoScanOptions>({
        scope: 'full',
        depth: 'standard',
        coreWebVitals: true,
        mobileCheck: true
    })

    const handleStart = () => {
        setStep(4) // Move to live progress step
        onStartScan(options)
    }

    const reset = () => {
        setStep(1)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={reset}>
            <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="flex h-[500px]">
                    {/* Sidebar Steps */}
                    <div className="w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col justify-between">
                        <div className="space-y-8">
                            {[
                                { s: 1, label: 'Scope', icon: Globe },
                                { s: 2, label: 'Depth', icon: Layers },
                                { s: 3, label: 'Checks', icon: Zap },
                                { s: 4, label: 'Status', icon: Rocket }
                            ].map((item) => (
                                <div key={item.s} className={cn(
                                    "flex items-center gap-3 transition-all",
                                    step === item.s ? "text-slate-900 scale-105" : "text-slate-400 opacity-50"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
                                        step === item.s ? "bg-slate-900 text-white shadow-lg" : "bg-white border border-slate-200"
                                    )}>
                                        {step > item.s ? <CheckCircle2 className="w-4 h-4" /> : item.s}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-700 uppercase leading-tight">AI Advisor</p>
                            <p className="text-[9px] text-emerald-600 mt-1 font-medium">Standard Scan is recommended for weekly health checks.</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-10 flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Crawl Scope</DialogTitle>
                                        <DialogDescription className="text-xs font-medium text-slate-400">Welche Bereiche Ihres Shops sollen analysiert werden?</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'full', label: 'Gesamter Shop', desc: 'Alle Produkte & Seiten' },
                                            { id: 'products', label: 'Nur Produkte', desc: 'Wichtig für Google Shopping' },
                                            { id: 'collections', label: 'Nur Kategorien', desc: 'Fokus auf Navigation' },
                                            { id: 'blog', label: 'Nur Blog', desc: 'Content-Marketing Fokus' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setOptions({ ...options, scope: item.id as any })}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 text-left transition-all",
                                                    options.scope === item.id ? "border-slate-900 bg-slate-50 shadow-inner" : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <p className="text-[11px] font-black uppercase text-slate-900">{item.label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">{item.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Scan Depth</DialogTitle>
                                        <DialogDescription className="text-xs font-medium text-slate-400">Wie tiefgehend soll die Analyse sein?</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'quick', label: 'Schnell', desc: 'Identifiziert nur die kritischsten SEO-Probleme.' },
                                            { id: 'standard', label: 'Standard', desc: 'Umfassende Prüfung für tägliche Optimierung.' },
                                            { id: 'deep', label: 'Deep Crawl', desc: 'Enterprise-Tiefe inklusive Core Web Vitals Analyse.' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setOptions({ ...options, depth: item.id as any })}
                                                className={cn(
                                                    "w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all",
                                                    options.depth === item.id ? "border-slate-900 bg-slate-50 shadow-inner" : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <div>
                                                    <p className="text-[11px] font-black uppercase text-slate-900">{item.label}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                                </div>
                                                {options.depth === item.id && <CheckCircle2 className="w-5 h-5 text-slate-900" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Advanced Checks</DialogTitle>
                                        <DialogDescription className="text-xs font-medium text-slate-400">Zusätzliche Performance & UX Prüfungen.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-900">Core Web Vitals</p>
                                                <p className="text-[10px] text-slate-400 font-medium">LCP, FID, CLS und Speed Score</p>
                                            </div>
                                            <Switch
                                                checked={options.coreWebVitals}
                                                onCheckedChange={(v) => setOptions({ ...options, coreWebVitals: v })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-900">Mobile Validation</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Prüfung auf mobilfreundliche Darstellung</p>
                                            </div>
                                            <Switch
                                                checked={options.mobileCheck}
                                                onCheckedChange={(v) => setOptions({ ...options, mobileCheck: v })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Rocket className="w-8 h-8 text-slate-900" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase text-slate-900">Scan läuft...</h3>
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                            {scanProgress?.currentStage === 'crawl' ? 'Sammle URLs...' :
                                                scanProgress?.currentStage === 'analyze' ? 'Analysiere Seiten...' :
                                                    scanProgress?.currentStage === 'score' ? 'Berechne SEO Score...' : 'Konstruiere Report...'}
                                        </p>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[200px]">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${scanProgress?.progress || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">
                                        {scanProgress?.crawledUrls || 0} / {scanProgress?.totalUrls || '?'} URLs
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-8 border-t border-slate-100 pt-6">
                            {step < 4 ? (
                                <div className="flex justify-between w-full">
                                    <Button
                                        variant="ghost"
                                        className="text-[10px] font-black uppercase tracking-widest"
                                        onClick={step === 1 ? reset : () => setStep(step - 1)}
                                    >
                                        {step === 1 ? 'Abbrechen' : 'Zurück'}
                                    </Button>
                                    <Button
                                        className="bg-slate-900 text-white hover:bg-slate-800 font-black text-[10px] uppercase tracking-widest px-8 rounded-xl h-12"
                                        onClick={step === 3 ? handleStart : () => setStep(step + 1)}
                                    >
                                        {step === 3 ? 'SCAN STARTEN' : 'WEITER'}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-red-100 text-red-600 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest rounded-xl"
                                    onClick={reset}
                                >
                                    ABBRECHEN
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
