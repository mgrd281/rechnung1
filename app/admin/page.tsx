'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, UserCheck, ShieldAlert, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface AdminStats {
    totalUsers: number
    verifiedUsers: number
    adminUsers: number
    activeToday: number
}

interface ActivityLog {
    id: string
    action: string
    ipAddress?: string
    createdAt: string
    user?: {
        name: string | null
        email: string
        image: string | null
    }
}

interface GrowthData {
    date: string
    count: number
    formattedDate: string
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [growthData, setGrowthData] = useState<GrowthData[]>([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        try {
            const [statsRes, activityRes, growthRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/activity?limit=10'),
                fetch('/api/admin/growth?range=30')
            ])

            if (statsRes.ok) setStats(await statsRes.json())
            if (activityRes.ok) setActivities(await activityRes.json())
            if (growthRes.ok) setGrowthData(await growthRes.json())

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [loadData])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
                <p className="text-slate-500 mt-2">Willkommen im Enterprise Control Center.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Gesamtbenutzer"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    subtext="Registrierte Benutzer"
                />
                <KPICard
                    title="Verifiziert"
                    value={stats?.verifiedUsers || 0}
                    icon={UserCheck}
                    subtext="E-Mail bestätigt"
                />
                <KPICard
                    title="Admins"
                    value={stats?.adminUsers || 0}
                    icon={ShieldAlert}
                    subtext="Systemadministratoren"
                />
                <KPICard
                    title="Heute Aktiv"
                    value={stats?.activeToday || 0}
                    icon={Activity}
                    subtext="Logins in 24h"
                    highlight
                />
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Benutzerwachstum</CardTitle>
                        <CardDescription>Neuanmeldungen in den letzten 30 Tagen.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="formattedDate"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8b5cf6"
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle>Letzte Aktivitäten</CardTitle>
                        <CardDescription>Echtzeit-Feed.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto max-h-[600px] pr-2 custom-scrollbar">
                        <div className="space-y-6">
                            {activities.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">Keine Aktivitäten gefunden.</p>
                            ) : (
                                activities.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, subtext, highlight = false }: any) {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm font-medium">{title}</span>
                    <Icon className={`h-4 w-4 ${highlight ? 'text-violet-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
                    <span className="text-xs text-slate-500">
                        {subtext}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
    const user = activity.user
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'SY' // System

    const displayName = user?.name || 'System'
    const ip = activity.ipAddress || 'IP unbekannt'

    return (
        <div className="flex gap-4">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden ${user ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-400' // System styling
                }`}>
                {user?.image ? (
                    <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                    initials
                )}
            </div>
            <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-900">
                    <span className="font-semibold">{displayName}</span> {formatAction(activity.action)}
                </p>
                <p className="text-xs text-slate-500">
                    Vor {formatDistanceToNow(new Date(activity.createdAt), { locale: de })} • {ip}
                </p>
            </div>
        </div>
    )
}

function formatAction(action: string) {
    const map: Record<string, string> = {
        'user.login_success': 'hat sich angemeldet.',
        'user.login_failed': 'hatte einen fehlgeschlagenen Login.',
        'user.logout': 'hat sich abgemeldet.',
        'user.created': 'hat sich registriert.',
        'user.updated': 'hat das Profil aktualisiert.',
        'audit.log': 'Ereignis protokolliert',
        // Add more mappings as needed
    }
    return map[action] || action
}
