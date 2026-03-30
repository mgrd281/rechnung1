'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Zap, Shield, History, RotateCcw,
    AlertTriangle, Bot, CheckCircle2,
    Settings2, Info, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AutopilotConfig, AutopilotMode } from '@/types/seo-types'
import { useState } from 'react'

interface SeoAutopilotSettingsProps {
    config: AutopilotConfig
    onUpdateConfig: (config: AutopilotConfig) => void
    onEmergencyStop: () => void
}

export function SeoAutopilotSettings({ config, onUpdateConfig, onEmergencyStop }: SeoAutopilotSettingsProps) {
    const [localConfig, setLocalConfig] = useState(config)

    const update = (updates: Partial<AutopilotConfig>) => {
        const newConfig = { ...localConfig, ...updates }
        setLocalConfig(newConfig)
        onUpdateConfig(newConfig)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Status Header */}
            <Card className={cn(
                "border-none shadow-xl transition-all duration-500 rounded-3xl overflow-hidden",
                localConfig.mode === 'auto' ? "bg-slate-900 text-white" : "bg-white text-slate-900"
            )}>
                <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl",
                            localConfig.mode === 'auto' ? "bg-emerald-500 text-white rotate-3" : "bg-slate-100 text-slate-400"
                        )}>
                            <Bot className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase border-none",
                                    localConfig.mode === 'auto' ? "bg-white/20 text-emerald-400" : "bg-slate-100 text-slate-400"
                                )}>
                                    Status: {localConfig.mode === 'auto' ? 'Active' : localConfig.mode === 'draft' ? 'Draft Only' : 'Disabled'}
                                </Badge>
                                {localConfig.mode === 'auto' && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight">AI SEO Autopilot</h2>
                            <p className={cn(
                                "text-sm font-medium",
                                localConfig.mode === 'auto' ? "text-white/60" : "text-slate-400"
                            )}>Zerstörungsfreie, KI-gesteuerte SEO Optimierung für Ihren Shop.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            {(['off', 'draft', 'auto'] as AutopilotMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => update({ mode: m })}
                                    className={cn(
                                        "flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        localConfig.mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {m === 'off' ? 'Deaktiviert' : m === 'draft' ? 'Nur Drafts' : 'Vollautomatisch'}
                                </button>
                            ))}
                        </div>
                        {localConfig.mode === 'auto' && (
                            <Button
                                variant="destructive"
                                className="h-12 rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-red-900/20 animate-pulse"
                                onClick={onEmergencyStop}
                            >
                                NOT-STOPP AUSLÖSEN
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Safety Rules */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Sicherheits-Regeln
                    </h3>
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase">Confidence Threshold</p>
                                        <p className="text-[10px] text-slate-400">Nur anwenden wenn KI-Sicherheit {'>'} {Math.round(localConfig.confidenceThreshold * 100)}%</p>
                                    </div>
                                    <input
                                        type="range"
                                        className="w-24 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                        value={localConfig.confidenceThreshold * 100}
                                        onChange={(e) => update({ confidenceThreshold: parseInt(e.target.value) / 100 })}
                                        max={100}
                                        min={50}
                                    />
                                </div>
                                <div className="h-px bg-slate-50" />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase">Markennamen schützen</p>
                                        <p className="text-[10px] text-slate-400">Namen von Brand & Produkten nie verändern.</p>
                                    </div>
                                    <Switch checked={localConfig.preserveBrandNames} onCheckedChange={(v: boolean) => update({ preserveBrandNames: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase">Preise schützen</p>
                                        <p className="text-[10px] text-slate-400">Produkt-Preise im SEO Text nie erwähnen.</p>
                                    </div>
                                    <Switch checked={localConfig.neverChangePrice} onCheckedChange={(v: boolean) => update({ neverChangePrice: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase">Limitierung pro Tag</p>
                                        <p className="text-[10px] text-slate-400">Maximal {localConfig.dailyLimit} Änderungen pro Tag.</p>
                                    </div>
                                    <Input
                                        type="number"
                                        className="w-16 h-8 text-xs font-bold bg-slate-50 border-none rounded-lg text-center"
                                        value={localConfig.dailyLimit}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ dailyLimit: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History & Rollback */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <History className="w-4 h-4" /> Letzte Optimierungen
                    </h3>
                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {[
                                    { date: 'Vor 12 Min', action: 'Alt text generated', target: 'Classic Belt', confidence: 0.98 },
                                    { date: 'Vor 45 Min', action: 'Meta Title optimized', target: 'Leather Bag', confidence: 0.92 }
                                ].map((log, i) => (
                                    <div key={i} className="p-6 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-900">{log.action}</p>
                                                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{log.target} • {log.date}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-900">
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 border-t border-slate-50">
                                VOLLSTÄNDIGES PROTOKOLL ANSEHEN
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
