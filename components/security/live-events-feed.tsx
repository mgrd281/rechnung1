'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    ShieldAlert,
    UserX,
    ShoppingCart,
    ChevronDown,
    ChevronRight,
    Globe,
    Terminal,
    AlertCircle
} from "lucide-react"

export function LiveEventsFeed() {
    const [events, setEvents] = useState<any[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/security/events')
            if (res.ok) {
                const data = await res.json()
                setEvents(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvents()
        const interval = setInterval(fetchEvents, 15000) // Poll every 15s
        return () => clearInterval(interval)
    }, [])

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 text-red-600 border-red-100'
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'low': return 'bg-blue-50 text-blue-600 border-blue-100'
            default: return 'bg-slate-100 text-slate-500'
        }
    }

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'login_failed': return <UserX className="w-4 h-4" />
            case 'suspicious_checkout': return <ShoppingCart className="w-4 h-4" />
            case 'brute_force_detected': return <ShieldAlert className="w-4 h-4" />
            case 'ip_blocked': return <AlertCircle className="w-4 h-4" />
            default: return <Activity className="w-4 h-4" />
        }
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 border-b px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-900">Echtzeit-Feed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-sm">Synchronisiere Live-Daten...</div>
                    ) : events.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-sm">Keine aktuellen Events gefunden.</div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="group">
                                <div
                                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${getSeverityStyles(event.severity)}`}>
                                            {getEventIcon(event.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{event.type.replace(/_/g, ' ').toUpperCase()}</span>
                                                <Badge variant="outline" className={`text-[10px] font-bold uppercase ${getSeverityStyles(event.severity)}`}>
                                                    {event.severity}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                <span className="font-mono">{event.ip}</span>
                                                <span>•</span>
                                                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {expandedId === event.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />}
                                </div>

                                {expandedId === event.id && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50/30 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <Globe className="w-3 h-3" /> Herkunft
                                                </div>
                                                <p className="text-sm font-bold text-slate-900">{event.details.country || 'Unbekannt'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <Terminal className="w-3 h-3" /> Endpunkt
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 font-mono">{event.details.path || '/'}</p>
                                            </div>
                                            <div className="space-y-1 lg:col-span-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <Activity className="w-3 h-3" /> User Agent
                                                </div>
                                                <p className="text-xs text-slate-600 truncate">{event.details.userAgent || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
