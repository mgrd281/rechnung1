'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Euro, Activity, CheckCircle, Clock } from "lucide-react"

interface RecoveryDashboardProps {
    stats: {
        openAmount: number
        recoveredAmount: number
        activeRuns: number
        successRate: number
        trends?: {
            openAmount: number
            recoveredAmount: number
            successRate: number
        }
        series?: Array<{ date: string; value: number }>
    }
    funnel: Array<{ step: string; count: number; conversion: number }>
}

export function RecoveryDashboard({ stats, funnel }: RecoveryDashboardProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Offener Betrag"
                    value={`€${stats.openAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
                    icon={Euro}
                    trend={stats.trends?.openAmount}
                    subtext="Aktuell ausstehend"
                    series={stats.series}
                />
                <KPICard
                    title="Wiederhergestellt (30T)"
                    value={`€${stats.recoveredAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
                    icon={CheckCircle}
                    trend={stats.trends?.recoveredAmount}
                    subtext="Erfolgreich eingezogen"
                    color="text-emerald-600"
                    series={[]} // Hidden for this card for variety
                />
                <KPICard
                    title="Erfolgsquote"
                    value={`${stats.successRate}%`}
                    icon={Activity}
                    trend={stats.trends?.successRate}
                    subtext="Mahnwesen Effizienz"
                    color="text-violet-600"
                />
                <KPICard
                    title="Aktive Mahnläufe"
                    value={stats.activeRuns}
                    icon={Clock}
                    subtext="In Bearbeitung"
                    color="text-amber-600"
                />
            </div>

            <Card className="border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Recovery Funnel Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="relative flex items-center justify-between gap-1">
                        {funnel.map((step, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                                {/* Funnel Block */}
                                <div className="w-full flex justify-center mb-4">
                                    <div
                                        className="bg-slate-900 rounded-lg transition-all duration-700 relative group-hover:bg-slate-800 shadow-lg shadow-slate-200"
                                        style={{
                                            width: `${Math.max(20, (step.count / (funnel[0]?.count || 1)) * 100)}%`,
                                            height: '60px',
                                            opacity: 1 - (index * 0.15)
                                        }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xs">
                                            {step.count}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-0.5">{step.step}</div>
                                    <div className="text-[10px] font-bold text-slate-400">{step.conversion}% {index === 0 ? 'Fokus' : 'Rate'}</div>
                                </div>

                                {index < funnel.length - 1 && (
                                    <div className="absolute top-7 -right-1/2 translate-x-1/2 w-8 flex justify-center">
                                        <ArrowUpRight className="w-3 h-3 text-slate-200 rotate-45" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, trend, subtext, color = "text-slate-900", series }: any) {
    return (
        <Card className="border-slate-200 shadow-sm group hover:border-slate-300 transition-all overflow-hidden">
            <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Icon className="h-4 w-4" />
                    </div>
                    {trend !== undefined && (
                        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center border ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
                    <p className="text-[10px] font-medium text-slate-400">{subtext}</p>
                </div>

                {series && series.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none">
                        <svg className="w-full h-full" preserveAspectRatio="none">
                            <polyline
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                points={series.map((s: any, i: number) => `${(i / (series.length - 1)) * 100},${40 - (s.value / 1000) * 40}`).join(' ')}
                                className="text-slate-900"
                            />
                        </svg>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
