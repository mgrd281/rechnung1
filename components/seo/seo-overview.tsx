'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Activity, AlertCircle, CheckCircle2, TrendingUp,
    Search, Clock, ChevronRight, ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SeoStats, SeoIssue } from '@/types/seo-types'

interface SeoOverviewProps {
    stats: SeoStats
    topIssues: SeoIssue[]
    onFixIssue: (issueId: string) => void
    onStartScan: () => void
}

export function SeoOverview({ stats, topIssues, onFixIssue, onStartScan }: SeoOverviewProps) {
    const kpis = [
        { label: 'SEO Health Score', value: stats.healthScore, trend: '+2%', color: 'text-emerald-600', icon: Activity, sparkline: `${stats.healthScore}%` },
        { label: 'Kritische Fehler', value: stats.criticalErrors, trend: '-3', color: 'text-red-500', icon: AlertCircle, sparkline: '30%' },
        { label: 'Warnungen', value: stats.warnings, trend: '+1', color: 'text-orange-500', icon: ShieldAlert, sparkline: '50%' },
        { label: 'Chancen', value: stats.opportunities, trend: '+5', color: 'text-blue-600', icon: TrendingUp, sparkline: '70%' }
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white rounded-2xl">
                        <CardContent className="p-6 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-2 rounded-xl bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all",
                                    kpi.color.replace('text', 'text-slate-900')
                                )}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase">{kpi.trend}</Badge>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                <h3 className={cn("text-3xl font-black", kpi.color)}>{kpi.value}</h3>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
                                <div className={cn("h-full opacity-50", kpi.color.replace('text', 'bg'))} style={{ width: kpi.sparkline }} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top 5 Critical Issues */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Top Kritische Fehler</h2>
                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alle ansehen</Button>
                    </div>

                    <div className="space-y-3">
                        {topIssues.length > 0 ? (
                            topIssues.map((issue) => (
                                <Card key={issue.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all rounded-2xl overflow-hidden">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase">{issue.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[300px]">
                                                    {issue.url} • {issue.category}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl"
                                            onClick={() => onFixIssue(issue.id)}
                                        >
                                            Fix Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-medium">Keine kritischen Fehler gefunden. Großartig!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scan Info & Quick Actions */}
                <div className="space-y-6">
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Scan Status</h2>
                    <Card className="border-none shadow-sm bg-slate-900 text-white rounded-3xl overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Letzter Scan</p>
                                        <p className="text-sm font-bold">{stats.lastScan?.timestamp || 'Nie'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Search className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gescannte Seiten</p>
                                        <p className="text-sm font-bold">{stats.lastScan?.pagesScanned || 0} URLs</p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg border-none"
                                onClick={onStartScan}
                            >
                                NEUEN SCAN STARTEN
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
