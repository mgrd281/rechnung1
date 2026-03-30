'use client'

import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, Users, Activity, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react"

interface SecurityKpisProps {
    stats: {
        blockedToday: number
        failedLogins24h: number
        activeBlocks: number
        riskLevel: 'Low' | 'Medium' | 'High'
        trends?: {
            blockedToday: number
            failedLogins: number
        }
    }
}

export function SecurityKpis({ stats }: SecurityKpisProps) {
    const riskColors = {
        Low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        Medium: 'bg-amber-100 text-amber-600 border-amber-200',
        High: 'bg-red-100 text-red-600 border-red-200'
    }

    return (
        <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
                <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        {stats.trends?.blockedToday && (
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stats.trends.blockedToday > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {stats.trends.blockedToday > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(stats.trends.blockedToday)}%
                            </div>
                        )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blockiert heute</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.blockedToday}</h3>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fehlgeschlagene Logins (24h)</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.failedLogins24h}</h3>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktive Sperren</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.activeBlocks}</h3>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskColors[stats.riskLevel]}`}>
                            {stats.riskLevel.toUpperCase()}
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risiko-Level</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.riskLevel}</h3>
                </CardContent>
            </Card>
        </div>
    )
}
