'use client'

import { useState } from 'react'
import {
    X, AlertCircle, Youtube,
    Settings, Play, Eye,
    Monitor, ShieldAlert,
    Info, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VideoSpiderJob, VideoSpiderStatus } from '@/types/video-spider-types'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VideoSpiderWizardProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (jobId: string) => void
}

export function VideoSpiderWizard({ isOpen, onClose, onSuccess }: VideoSpiderWizardProps) {
    const [urls, setUrls] = useState('')
    const [spiderCount, setSpiderCount] = useState(5)
    const [mode, setMode] = useState<'VERIFY' | 'PLAY'>('VERIFY')
    const [watchSeconds, setWatchSeconds] = useState(5)
    const [mute, setMute] = useState(true)
    const [captureProof, setCaptureProof] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleStart = async () => {
        const urlList = urls.split('\n').map(u => u.trim()).filter(u => u.length > 0)
        if (urlList.length === 0) {
            setError('Bitte mindestens eine URL eingeben.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/video-spider/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urls: urlList,
                    spiderCount,
                    mode,
                    watchSeconds,
                    mute,
                    captureProof
                })
            })

            const data = await res.json()
            if (data.success) {
                onSuccess(data.jobId)
            } else {
                setError(data.error || 'Fehler beim Starten des Jobs.')
            }
        } catch (err) {
            setError('Verbindungsfehler zum Server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-300">

                {/* Left side: Info Panel */}
                <div className="md:w-1/3 bg-slate-900 border-r border-white/10 p-8 text-white flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                <Youtube className="w-6 h-6 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Video Spider</h2>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Validierungs-Engine</h3>
                            <div className="space-y-3">
                                <FeatureItem icon={Monitor} title="Kopfloser Browser" desc="Simuliert echte Benutzerinteraktion" />
                                <FeatureItem icon={ShieldAlert} title="Bypass Protection" desc="Umgeht Bot-Checks & Security" />
                                <FeatureItem icon={Play} title="Watch Verification" desc="Wiedergabe unter Last testen" />
                            </div>
                        </div>

                        <Card className="bg-amber-500/10 border-amber-500/20 p-4">
                            <div className="flex gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                                <p className="text-[11px] text-amber-200/80 font-medium leading-relaxed">
                                    <strong>Hinweis:</strong> Dieses Tool dient nur der Qualitätssicherung. Manipulation von Metriken ist untersagt.
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Technologie</div>
                        <Badge className="bg-slate-800 text-slate-300 border-none font-bold">Playwright Headless</Badge>
                    </div>
                </div>

                {/* Right side: Form Panel */}
                <div className="md:w-2/3 p-10 overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Einstellungen</h3>
                            <p className="text-slate-500 text-sm">Geben Sie YouTube URLs ein und legen Sie die Scan-Parameter fest.</p>
                        </div>

                        <div className="space-y-6">
                            {/* URLs Textarea */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                                    Video URLs (Eine pro Zeile)
                                    <span className="text-violet-500">{urls.split('\n').filter(u => u.trim()).length} erkannt</span>
                                </Label>
                                <Textarea
                                    value={urls}
                                    onChange={(e) => setUrls(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="min-h-[120px] bg-slate-50 border-slate-200 rounded-2xl resize-none font-mono text-sm p-4 focus:ring-slate-900"
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Konkurrenz (Spider Count)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={spiderCount}
                                            onChange={(e) => setSpiderCount(parseInt(e.target.value))}
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Parallele Jobs</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Watch Duration</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min={3}
                                            max={30}
                                            value={watchSeconds}
                                            onChange={(e) => setWatchSeconds(parseInt(e.target.value))}
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sekunden</span>
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                <ToggleRow
                                    label="Watch Mode (Playback Check)"
                                    sub="Video wird kurz im Browser abgespielt"
                                    checked={mode === 'PLAY'}
                                    onChange={(v: boolean) => setMode(v ? 'PLAY' : 'VERIFY')}
                                />
                                <ToggleRow
                                    label="Screenshot Proof"
                                    sub="Momentaufnahme des Players speichern"
                                    checked={captureProof}
                                    onChange={setCaptureProof}
                                />
                                <ToggleRow
                                    label="Muted Playback"
                                    sub="Ton während des Tests stummgeschaltet"
                                    checked={mute}
                                    onChange={setMute}
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    onClick={handleStart}
                                    disabled={loading}
                                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Initialisiere Spider...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-white" />
                                            Mission Starten
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-3 items-start group">
            <div className="w-8 h-8 rounded-lg outline outline-1 outline-white/10 group-hover:bg-white/5 flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-4 h-4 text-violet-400" />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-tight">{title}</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">{desc}</p>
            </div>
        </div>
    )
}

function ToggleRow({ label, sub, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900">{label}</Label>
                <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    )
}
