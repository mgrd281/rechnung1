'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Zap, TrendingUp, AlertTriangle } from "lucide-react"

export function RulesPerformance({ settings, onUpdate }: any) {
    return (
        <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Recovery Strategy</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <StrategyToggle
                            title="VIP Protection"
                            description="Flow für VIP-Kunden pausieren."
                            status="ACTIVE"
                        />
                        <StrategyToggle
                            title="Small Amount Skip"
                            description="Überspringe Flow bei Beträgen < 10€."
                            status="ACTIVE"
                        />
                        <StrategyToggle
                            title="Auto-Stop on Payment"
                            description="Automation bei Zahlungseingang stornieren."
                            status="FIXED"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-900 bg-slate-900 text-white shadow-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Performance</p>
                            <h3 className="text-xl font-black mt-1">Recovery Rate</h3>
                        </div>
                        <Badge className="bg-emerald-500 text-white border-none font-black">+14.2%</Badge>
                    </div>

                    <div className="h-24 flex items-end gap-1.5 px-2">
                        {[40, 60, 45, 80, 55, 90, 75, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-white/10 rounded-t hover:bg-white/30 transition-colors relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-slate-400">Best Step: 1. Erinnerung</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-tight">Anwalts-Info</p>
                    <p className="text-[10px] mt-0.5 leading-relaxed font-medium">Beachten Sie die legalen Fristen für Verzugszinsen in Ihrer Region.</p>
                </div>
            </div>
        </div>
    )
}

function StrategyToggle({ title, description, status }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{title}</span>
                    {status === 'FIXED' && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] h-4 px-1">SYSTEM</Badge>}
                </div>
                <p className="text-[10px] font-medium text-slate-500">{description}</p>
            </div>
            <Switch defaultChecked={status === 'ACTIVE' || status === 'FIXED'} disabled={status === 'FIXED'} />
        </div>
    )
}
