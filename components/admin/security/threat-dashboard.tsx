'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, Ban, AlertTriangle, Activity } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
    stats: any
    feed: any[]
}

export function ThreatDashboard({ stats, feed }: Props) {
    return (
        <div className="space-y-6">
            {/* KPI Row (Live Cards) - Zone A Extension */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Aktive Bedrohungen"
                    value={stats?.activeThreats || 0}
                    icon={AlertTriangle}
                    trend="pending" // Calculate trend if history available
                    color="text-amber-600"
                />
                <KPICard
                    title="Blockierte heute"
                    value={stats?.blockedToday || 0}
                    icon={Ban}
                    trend="up"
                    color="text-red-600"
                />
                <KPICard
                    title="Fehlgeschlagene Logins (24h)"
                    value={stats?.failedLogins || 0}
                    icon={Shield}
                    color="text-slate-600"
                />
                <KPICard
                    title="Risiko-Level"
                    value={stats?.riskLevel || 'Low'}
                    icon={Activity}
                    color={stats?.riskLevel === 'High' ? 'text-red-600' : 'text-emerald-600'}
                />
            </div>

            {/* Zone B: Threat Intel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-violet-600" />
                            Live Threat Feed
                        </CardTitle>
                        <CardDescription>Echtzeit-Stream von Sicherheitsereignissen</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {feed.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <Shield className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                    <p>Keine Bedrohungen erkannt</p>
                                </div>
                            ) : (
                                feed.map((event: any) => (
                                    <div key={event.id} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${event.blocked ? 'bg-red-500' : 'bg-amber-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {event.attemptType === 'LOGIN_FAILED' ? 'Fehlgeschlagener Login' : event.attemptType}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {event.email} • IP {event.ipAddress || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-xs text-slate-400">
                                                {formatDistanceToNow(new Date(event.createdAt), { locale: de, addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Attack Map / Top IPs */}
                <Card className="border-slate-200 h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Angriffs-Ursprung</CardTitle>
                        <CardDescription>Top attackiernde IPs und Länder</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center bg-slate-50/50 m-6 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="text-center text-slate-400">
                            <GlobeIcon />
                            <p className="mt-2 text-sm font-medium">Global Attack Map</p>
                            <p className="text-xs">(Phase 2 Feature)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm font-medium">{title}</span>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className={`text-2xl font-bold ${color === 'text-red-600' ? 'text-red-600' : 'text-slate-900'}`}>
                        {value}
                    </h3>
                    {trend === 'up' && <span className="text-xs text-red-500">↑</span>}
                </div>
            </CardContent>
        </Card>
    )
}

function GlobeIcon() {
    return (
        <svg
            className="w-16 h-16 mx-auto text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
