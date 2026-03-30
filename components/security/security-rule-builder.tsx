'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Zap, Settings2, Play, AlertTriangle } from "lucide-react"

export function SecurityRuleBuilder() {
    const [rules, setRules] = useState([
        {
            id: 'rule-1',
            name: 'Brute-Force Login Schutz',
            description: 'Sperrt IPs automatisch für 24h nach 5 fehlgeschlagenen Versuchen in 10 Min.',
            status: 'active',
            severity: 'critical',
            impact: 'Hoch'
        },
        {
            id: 'rule-2',
            name: 'Spam Checkout Erkennung',
            description: 'Blockiert IPs bei mehr als 3 Käufen pro Minute von der gleichen Adresse.',
            status: 'active',
            severity: 'medium',
            impact: 'Mittel'
        },
        {
            id: 'rule-3',
            name: 'Temporärer E-Mail Block',
            description: 'Blockiert Registrierungen von bekannten "Trash-Mail" Anbietern.',
            status: 'inactive',
            severity: 'low',
            impact: 'Niedrig'
        }
    ])

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Sicherheitsregeln</h3>
                    <p className="text-sm text-slate-500">Automatisieren Sie Ihre Verteidigung mit intelligenten Regeln.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-bold"><Play className="w-4 h-4 mr-2" /> Simulation</Button>
                    <Button size="sm" className="bg-slate-900 text-white font-bold">+ Neue Regel</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.map((rule) => (
                    <Card key={rule.id} className={`border-slate-200 hover:border-slate-300 transition-all shadow-sm ${rule.status === 'active' ? 'bg-white' : 'bg-slate-50/50 grayscale'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className={`text-[10px] font-bold uppercase mb-2 ${rule.severity === 'critical' ? 'text-red-600 border-red-100 bg-red-50' : 'text-slate-500'}`}>
                                    {rule.severity}
                                </Badge>
                                <Switch
                                    checked={rule.status === 'active'}
                                    onCheckedChange={() => toggleRule(rule.id)}
                                />
                            </div>
                            <CardTitle className="text-sm font-bold leading-tight">{rule.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">
                                {rule.description}
                            </p>

                            <div className="pt-4 border-t flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[10px] font-bold text-slate-600 uppercase">Impact: {rule.impact}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold px-2 hover:bg-slate-100">
                                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Edit
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-slate-200 mt-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="font-bold">Globale Sicherheitswarnung</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Mehrere Brute-Force Versuche aus denselben IP-Bereichen erkannt.</p>
                    </div>
                </div>
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6">Schutz verschärfen</Button>
            </div>
        </div>
    )
}
