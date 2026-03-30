'use client'

import { useState, useEffect } from 'react'
import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import {
    Activity,
    Mail,
    Webhook,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    Search,
    ChevronRight,
    ChevronDown,
    ShieldAlert,
    Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface LogEntry {
    id: string
    timestamp: string
    topic?: string
    orderName?: string
    status: 'SUCCESS' | 'FAILED' | 'PENDING'
    message: string
    details?: any
}

interface EmailLogEntry {
    id: string
    recipient: string
    subject: string
    status: string
    sentAt: string
    error?: string
}

export default function DiagnosticPage() {
    const [loading, setLoading] = useState(true)
    const [webhookLogs, setWebhookLogs] = useState<LogEntry[]>([])
    const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([])
    const [inventoryStatus, setInventoryStatus] = useState<any[]>([])
    const [search, setSearch] = useState('')

    const fetchDiagnostics = async () => {
        setLoading(true)
        try {
            const resp = await fetch('/api/diagnostics')
            const data = await resp.json()
            if (data.success) {
                setWebhookLogs(data.webhookLogs || [])
                setEmailLogs(data.emailLogs || [])
                setInventoryStatus(data.inventory || [])
            }
        } catch (err) {
            console.error('Failed to fetch diagnostics', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDiagnostics()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="h-6 w-px bg-gray-200" />
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            System-Diagnose
                        </h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchDiagnostics} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Aktualisieren
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-emerald-100 bg-emerald-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Webhook className="w-4 h-4 text-emerald-600" />
                                Webhook Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700">Aktiv</div>
                            <p className="text-xs text-emerald-600 mt-1">Empfängt Signale von Shopify</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                E-Mail Service
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">Bereit</div>
                            <p className="text-xs text-blue-600 mt-1">Resend/SMTP konfiguriert</p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-100 bg-amber-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Database className="w-4 h-4 text-amber-600" />
                                Inventar Check
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-700">
                                {inventoryStatus.filter(p => (p._count?.keys || 0) === 0).length} Kritisch
                            </div>
                            <p className="text-xs text-amber-600 mt-1">Produkte ohne Keys</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Webhook Logs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Letzte Webhook-Aktivitäten</CardTitle>
                                <CardDescription>Die letzten 20 Signale von Shopify</CardDescription>
                            </div>
                            <Badge variant="outline" className="font-mono">Shopify Webhooks</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="border-t divide-y">
                            {webhookLogs.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 italic">Keine Webhook-Logs gefunden</div>
                            ) : (
                                webhookLogs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-gray-50 flex items-start gap-4 transition-colors">
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {log.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-900">{log.topic || 'Bestellung Update'}</span>
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {format(new Date(log.timestamp), 'HH:mm:ss', { locale: de })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">{log.message}</p>
                                            {log.orderName && (
                                                <Badge variant="secondary" className="mt-1 text-[10px] uppercase font-bold tracking-tight bg-gray-100 text-gray-600 border-none">
                                                    Order {log.orderName}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Email Logs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>E-Mail Versand-Historie</CardTitle>
                                <CardDescription>Status der letzten gesendeten Benachrichtigungen</CardDescription>
                            </div>
                            <Badge variant="outline" className="font-mono">Resend / SMTP</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="border-t divide-y">
                            {emailLogs.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 italic">Keine E-Mail-Logs gefunden</div>
                            ) : (
                                emailLogs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-gray-50 flex items-center gap-4 transition-colors">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <Mail className={`w-10 h-10 ${log.status === 'sent' || log.status === 'delivered' ? 'text-emerald-500' : 'text-red-500'} opacity-20`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-semibold text-gray-900">{log.recipient}</span>
                                                <Badge variant={log.status === 'sent' || log.status === 'delivered' ? 'default' : 'destructive'} className="text-[10px]">
                                                    {log.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{log.subject}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 italic">
                                                {format(new Date(log.sentAt), 'dd. MMM yyyy, HH:mm', { locale: de })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Warning */}
                <Card className="border-red-200">
                    <CardHeader className="bg-red-50/50">
                        <CardTitle className="text-red-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Inventar-Warnungen
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {inventoryStatus.filter(p => (p._count?.keys || 0) === 0).map(p => (
                                <div key={p.id} className="p-4 flex items-center justify-between bg-red-50/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-red-100 rounded flex items-center justify-center text-red-600 font-bold">!</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{p.title}</h4>
                                            <p className="text-xs text-gray-500">Shopify ID: {p.shopifyProductId}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-red-600">0 KEYS</Badge>
                                </div>
                            ))}
                            {inventoryStatus.filter(p => (p._count?.keys || 0) === 0).length === 0 && (
                                <div className="p-8 text-center text-emerald-600 font-medium">Alle aktiven Produkte haben verfügbare Keys.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
