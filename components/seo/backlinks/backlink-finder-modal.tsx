'use client'

import { useState } from 'react'
import {
    X, Globe, Crosshair,
    Zap, ShieldCheck, Clock,
    Info, Target as TargetIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface BacklinkFinderModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function BacklinkFinderModal({ isOpen, onClose, onSuccess }: BacklinkFinderModalProps) {
    const [step, setStep] = useState(1)
    const [target, setTarget] = useState('')
    const [mode, setMode] = useState('DOMAIN')
    const [level, setLevel] = useState('STANDARD')
    const [verifyMode, setVerifyMode] = useState('STRICT')
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    if (!isOpen) return null

    const handleStart = async () => {
        if (!target) {
            console.error('Target is missing');
            return;
        }

        console.log('Starting backlink research for:', target);
        setLoading(true)
        try {
            const res = await fetch('/api/backlinks/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, mode, crawlLevel: level, verifyMode })
            })

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`API Error: ${res.status} - ${errorText}`);
            }

            const data = await res.json()
            console.log('API Response:', data);

            if (data.success) {
                showToast('Backlink-Forschung gestartet!', 'success')
                onSuccess()
            } else {
                showToast(data.error || 'Fehler beim Starten', 'error', { description: 'Bitte versuchen Sie es später erneut.' })
            }
        } catch (err: any) {
            console.error('Failed to start backlink job:', err)
            showToast('Netzwerkfehler', 'error', { description: err.message || 'Verbindung zum Server fehlgeschlagen' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-5 min-h-[500px]">
                    {/* Left Panel: Info */}
                    <div className="md:col-span-2 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-violet-500 rounded-full blur-[100px]" />
                            <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-emerald-500 rounded-full blur-[100px]" />
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest mb-4 px-3 py-1">
                                    Enterprise Module
                                </Badge>
                                <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-4">Backlinks Intelligence</h2>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Maximale Coverage. Absolute Verifizierung. Finden und schützen Sie Ihre wertvollsten Verlinkungen.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <FeatureItem icon={ShieldCheck} text="100% Verifiziert" sub="Jeder Link wird live geprüft" />
                                <FeatureItem icon={Zap} text="Deep Discovery" sub="Eigene Crawler + SERP Data" />
                                <FeatureItem icon={Crosshair} text="Spam Erkennung" sub="KI-basierte Risikoanalyse" />
                            </div>
                        </div>

                        <div className="relative z-10 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verarbeitungszeit</p>
                                    <p className="text-sm font-bold">~ 5-15 Minuten</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Content */}
                    <div className="md:col-span-3 p-10 bg-white flex flex-col justify-between">
                        <div className="space-y-8">
                            {/* Step Indicator */}
                            <div className="flex items-center gap-2">
                                <div className={cn("w-12 h-1.5 rounded-full transition-all", step >= 1 ? "bg-slate-900" : "bg-slate-100")} />
                                <div className={cn("w-12 h-1.5 rounded-full transition-all", step >= 2 ? "bg-slate-900" : "bg-slate-100")} />
                                <div className={cn("w-12 h-1.5 rounded-full transition-all", step >= 3 ? "bg-slate-900" : "bg-slate-100")} />
                            </div>

                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-10">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Was möchten Sie scannen?</h3>
                                        <p className="text-slate-500 text-sm font-medium">Geben Sie eine Domain oder eine spezifische URL ein.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Button
                                                variant={mode === 'DOMAIN' ? 'default' : 'outline'}
                                                onClick={() => setMode('DOMAIN')}
                                                className={cn("flex-1 h-12 rounded-xl font-bold border-slate-200", mode === 'DOMAIN' ? "bg-slate-900" : "text-slate-600")}
                                            >
                                                <Globe className="w-4 h-4 mr-2" /> Domain
                                            </Button>
                                            <Button
                                                variant={mode === 'URL' ? 'default' : 'outline'}
                                                onClick={() => setMode('URL')}
                                                className={cn("flex-1 h-12 rounded-xl font-bold border-slate-200", mode === 'URL' ? "bg-slate-900" : "text-slate-600")}
                                            >
                                                <TargetIcon className="w-4 h-4 mr-2" /> URL
                                            </Button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                value={target}
                                                onChange={(e) => setTarget(e.target.value)}
                                                placeholder={mode === 'DOMAIN' ? 'beispiel.de' : 'https://beispiel.de/produkt'}
                                                className="h-14 bg-slate-50 border-slate-200 rounded-2xl pl-12 font-bold text-slate-900 focus:ring-slate-900"
                                            />
                                            <TargetIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        </div>

                                        <Card className="p-4 bg-emerald-50 border-emerald-100 flex gap-3">
                                            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                                                <strong>Tipp:</strong> Scannen Sie die Hauptdomain, um alle Backlinks Ihrer Marke zu finden.
                                            </p>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-10">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Scan Konfiguration</h3>
                                        <p className="text-slate-500 text-sm font-medium">Wählen Sie die Tiefe und Genauigkeit der Analyse.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discovery Tiefe</label>
                                            <Select value={level} onValueChange={setLevel}>
                                                <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-slate-50 font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-xl">
                                                    <SelectItem value="STANDARD" className="font-bold py-3 text-slate-700 focus:bg-slate-50">Standard (Schnell)</SelectItem>
                                                    <SelectItem value="DEEP" className="font-bold py-3 text-slate-700 focus:bg-slate-50">Deep Crawl (Maximum)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifizierung</label>
                                            <Select value={verifyMode} onValueChange={setVerifyMode}>
                                                <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-slate-50 font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-xl">
                                                    <SelectItem value="FAST" className="font-bold py-3 text-slate-700 focus:bg-slate-50">Schnell (Stichproben)</SelectItem>
                                                    <SelectItem value="STRICT" className="font-bold py-3 text-slate-700 focus:bg-slate-50">Strict (Jeder einzelne Link)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-10">
                                    <div className="space-y-2 text-center py-4">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100 shadow-xl shadow-emerald-100/50">
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Bereit zum Start</h3>
                                        <p className="text-slate-500 text-sm font-medium">Ihre Konfiguration ist bereit zur Ausführung.</p>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-3">
                                        <SummaryRow label="Ziel" value={target} />
                                        <SummaryRow label="Modus" value={mode} />
                                        <SummaryRow label="Tiefe" value={level === 'DEEP' ? 'Deep Crawl' : 'Standard'} />
                                        <SummaryRow label="Verify" value={verifyMode === 'STRICT' ? 'Strict Verification' : 'Fast'} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-8">
                            {step > 1 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(s => s - 1)}
                                    className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400"
                                >
                                    Zurück
                                </Button>
                            )}
                            <Button
                                onClick={step === 3 ? handleStart : () => setStep(s => s + 1)}
                                disabled={loading || (step === 1 && !target)}
                                className="h-14 flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200"
                            >
                                {loading ? 'Initialisiere...' : step === 3 ? 'Jetzt finden' : 'Weiter'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ icon: Icon, text, sub }: any) {
    return (
        <div className="flex items-start gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:bg-white/10 transition-colors">
                <Icon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
                <p className="text-sm font-black uppercase tracking-tight">{text}</p>
                <p className="text-[11px] text-slate-500 font-medium">{sub}</p>
            </div>
        </div>
    )
}

function SummaryRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest">{label}</span>
            <span className="text-slate-900 font-black uppercase text-[10px] tracking-tight">{value}</span>
        </div>
    )
}
