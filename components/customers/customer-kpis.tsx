'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, Crown, Landmark, RefreshCcw, ArrowUpRight, ArrowDownRight } from "lucide-react"

export function CustomerKPIs({ analytics }: any) {
    const kpis = [
        {
            label: 'Gesamt Kunden',
            value: analytics?.total || 0,
            icon: Users,
            trend: analytics?.trends?.total,
            color: 'text-slate-900',
            bg: 'bg-slate-50'
        },
        {
            label: 'Aktive Kunden',
            value: analytics?.activeCount || 0,
            icon: UserCheck,
            trend: analytics?.trends?.active,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'VIP Kunden',
            value: analytics?.vipCount || 0,
            icon: Crown,
            trend: analytics?.trends?.vip,
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        },
        {
            label: 'Ø LTV',
            value: `€${(analytics?.avgLtv || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
            icon: Landmark,
            trend: analytics?.trends?.ltv,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Wiederkaufrate',
            value: `${analytics?.repeatPurchaseRate || 0}%`,
            icon: RefreshCcw,
            trend: 2.1,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpis.map((kpi, i) => (
                <Card key={i} className="border-slate-200 shadow-sm group hover:border-slate-300 transition-all overflow-hidden border-none bg-white">
                    <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${kpi.bg} group-hover:bg-slate-900 group-hover:text-white transition-colors`}>
                                <kpi.icon className="h-4 w-4" />
                            </div>
                            {kpi.trend !== undefined && (
                                <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center border ${kpi.trend >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                    {kpi.trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                    {Math.abs(kpi.trend)}%
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</h3>
                        </div>

                        {/* Sparkline Mockup */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 opacity-10 pointer-events-none">
                            <svg className="w-full h-full" preserveAspectRatio="none">
                                <polyline
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    points="0,20 20,5 40,15 60,8 80,18 100,2"
                                    className="text-slate-900"
                                />
                            </svg>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
