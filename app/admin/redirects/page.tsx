'use client'

import { useState, useEffect } from 'react'
import { PageShell } from '@/components/layout/page-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertCircle,
    Link as LinkIcon,
    RefreshCw,
    FileText,
    Settings as SettingsIcon,
    Play,
    Zap,
    History,
    ExternalLink,
    AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

export default function RedirectsPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [stats, setStats] = useState({
        hits7d: 0,
        open404s: 0,
        activeRedirects: 0,
        savedVisitors: 0
    })
    const [loading, setLoading] = useState(true)
    const [scanStatus, setScanStatus] = useState<any>(null)
    const [brokenLinks, setBrokenLinks] = useState<any[]>([])
    const [redirects, setRedirects] = useState<any[]>([])
    const [suggestions, setSuggestions] = useState<Record<string, any>>({})
    const [fixingId, setFixingId] = useState<string | null>(null)

    useEffect(() => {
        fetchStats()
        fetchScanStatus()
    }, [])

    useEffect(() => {
        if (activeTab === '404s') fetchBrokenLinks()
        if (activeTab === 'redirects') fetchRedirects()
    }, [activeTab])

    const fetchBrokenLinks = async () => {
        try {
            const res = await fetch('/api/redirects/404?status=open')
            const data = await res.json()
            setBrokenLinks(data)
        } catch (e) { }
    }

    const fetchRedirects = async () => {
        try {
            const res = await fetch('/api/redirects/list')
            const data = await res.json()
            setRedirects(data)
        } catch (e) { }
    }

    const getSuggestion = async (id: string, path: string) => {
        try {
            const res = await fetch('/api/redirects/suggest', {
                method: 'POST',
                body: JSON.stringify({ path })
            })
            const data = await res.json()
            setSuggestions(prev => ({ ...prev, [id]: data }))
        } catch (e) { }
    }

    const create301 = async (path: string, target: string, brokenLinkId: string) => {
        setFixingId(brokenLinkId)
        try {
            const res = await fetch('/api/redirects/create', {
                method: 'POST',
                body: JSON.stringify({ path, target, brokenLinkId })
            })
            if (res.ok) {
                toast.success('Weiterleitung erstellt', { description: `301 für ${path} ist nun aktiv.` })
                fetchBrokenLinks()
                fetchStats()
            }
        } catch (e) {
            toast.error('Fehler beim Erstellen der Weiterleitung')
        } finally {
            setFixingId(null)
        }
    }

    const fetchStats = async () => {
        try {
            // Mocking for now - implementation will follow
            setStats({
                hits7d: 124,
                open404s: 18,
                activeRedirects: 42,
                savedVisitors: 850
            })
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchScanStatus = async () => {
        try {
            const res = await fetch('/api/redirects/scan/status')
            const data = await res.json()
            setScanStatus(data)
        } catch (e) { }
    }

    // Missing handlers causing crash
    const deleteHandler = async (id: string) => {
        try {
            const res = await fetch(`/api/redirects/delete?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Weiterleitung gelöscht')
                setRedirects(prev => prev.filter(r => r.id !== id))
            }
        } catch (e) {
            toast.error('Fehler beim Löschen')
        }
    }

    const handleCsvExport = () => {
        toast.info('CSV Export wird vorbereitet...')
        // Placeholder
    }

    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            toast.info(`Importiere ${file.name}...`)
            // Placeholder
        }
    }

    const startScan = async () => {
        try {
            const res = await fetch('/api/redirects/scan/start', { method: 'POST' })
            if (res.ok) {
                toast.success('Scan gestartet', { description: 'Der Storefront-Scan läuft im Hintergrund.' })
                fetchScanStatus()
            }
        } catch (e) {
            toast.error('Fehler beim Starten des Scans')
        }
    }

    return (
        <PageShell pageTitle="404 & Weiterleitungen" pageSubtitle="Automatische 301‑Weiterleitungen für maximale SEO‑Stabilität.">
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-slate-100 p-1">
                        <TabsTrigger value="overview">Übersicht</TabsTrigger>
                        <TabsTrigger value="404s">404 Fehler</TabsTrigger>
                        <TabsTrigger value="redirects">Weiterleitungen</TabsTrigger>
                        <TabsTrigger value="bulk">Bulk & CSV</TabsTrigger>
                        <TabsTrigger value="settings">Einstellungen</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                                <CardHeader className="p-4 pb-0">
                                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">404 Treffer (7 Tage)</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="text-2xl font-bold text-slate-900">{stats.hits7d}</div>
                                    <div className="text-xs text-rose-500 mt-1 flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> Handlungsbedarf
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                                <CardHeader className="p-4 pb-0">
                                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offene 404 Seiten</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="text-2xl font-bold text-slate-900">{stats.open404s}</div>
                                    <div className="text-xs text-slate-400 mt-1 italic">Vorschläge verfügbar</div>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                                <CardHeader className="p-4 pb-0">
                                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aktive Weiterleitungen</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="text-2xl font-bold text-slate-900">{stats.activeRedirects}</div>
                                    <div className="text-xs text-emerald-500 mt-1 flex items-center">
                                        <Zap className="w-3 h-3 mr-1" /> In Shopify aktiv
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm bg-gradient-to-br from-violet-50 to-white">
                                <CardHeader className="p-4 pb-0">
                                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-violet-600">Gerettete Besucher</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="text-2xl font-bold text-violet-700">{stats.savedVisitors}</div>
                                    <div className="text-xs text-violet-500 mt-1">SEO-Traffic erhalten</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity & Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2 border-slate-200 shadow-lg bg-white overflow-hidden">
                                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-bold">Aktivitäts-Status</CardTitle>
                                            <CardDescription>Aktuelle Analyse der Storefront-Stabilität</CardDescription>
                                        </div>
                                        {scanStatus?.status === 'RUNNING' ? (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1 animate-pulse">
                                                <RefreshCw className="w-3 h-3 animate-spin" /> Scan läuft...
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-50">Bereit für Scan</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-4">
                                            <div className="p-2 rounded-lg bg-blue-100">
                                                <History className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-blue-900">Auto-Refind™ Logik aktiv</div>
                                                <div className="text-xs text-blue-700 mt-1 max-w-md">
                                                    Das System schlägt automatisch semantisch passende Zielseiten vor, wenn eine 404 URL ein bekanntes Handle enthält.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="text-sm font-medium text-slate-700 mb-3">Top 404 Ursachen:</div>
                                            <div className="space-y-2">
                                                {[
                                                    { path: '/products/old-collection', hits: 42, reason: 'Produkt entfernt' },
                                                    { path: '/pages/summer-sale-2024', hits: 31, reason: 'Kampagne beendet' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-slate-400">#0{i + 1}</span>
                                                            <span className="font-medium text-slate-700">{item.path}</span>
                                                            <Badge variant="outline" className="text-[10px] bg-slate-100">{item.reason}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-rose-500 font-bold">{item.hits} Hits</span>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink className="w-3 h-3" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions Panel */}
                            <Card className="border-slate-200 shadow-lg bg-slate-900 text-white overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2 text-violet-400 mb-1">
                                        <Zap className="w-4 h-4 fill-current" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Quick Actions</span>
                                    </div>
                                    <CardTitle className="text-white text-lg">Express-Optimierung</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        className="w-full bg-white text-slate-900 hover:bg-slate-100 h-11 font-semibold justify-start pl-4"
                                        onClick={startScan}
                                        disabled={scanStatus?.status === 'RUNNING'}
                                    >
                                        <Play className="w-4 h-4 mr-3" />
                                        Storefront scannen
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-700 text-white hover:bg-slate-800 h-11 justify-start pl-4"
                                        onClick={() => setActiveTab('404s')}
                                    >
                                        <AlertCircle className="w-4 h-4 mr-3" />
                                        404 Fehler beheben
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-700 text-white hover:bg-slate-800 h-11 justify-start pl-4"
                                        onClick={() => setActiveTab('bulk')}
                                    >
                                        <FileText className="w-4 h-4 mr-3" />
                                        CSV Import
                                    </Button>

                                    <div className="mt-6 p-4 rounded-xl bg-violet-600/20 border border-violet-500/30">
                                        <div className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">KI Status</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-sm font-medium">Suggestion Engine bereit</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="404s" className="mt-6">
                        <Card className="border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Broken Link Monitor</CardTitle>
                                    <CardDescription>Echtzeit-Erkennung von 404 Fehlern durch Besucher-Tracking.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchBrokenLinks}>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Aktualisieren
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-xl overflow-hidden bg-white">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="text-left p-4 font-semibold text-slate-600">URL (404)</th>
                                                <th className="text-left p-4 font-semibold text-slate-600">Hits</th>
                                                <th className="text-left p-4 font-semibold text-slate-600">Last Seen</th>
                                                <th className="text-left p-4 font-semibold text-slate-600">KI Vorschlag</th>
                                                <th className="text-right p-4 font-semibold text-slate-600">Aktion</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {brokenLinks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                                        Keine offenen 404 Fehler gefunden. Hervorragend!
                                                    </td>
                                                </tr>
                                            ) : brokenLinks.map((link) => (
                                                <tr key={link.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 font-mono text-xs text-rose-600">{link.url}</td>
                                                    <td className="p-4 font-bold">{link.hits}</td>
                                                    <td className="p-4 text-slate-500">{new Date(link.lastSeen).toLocaleString('de-DE')}</td>
                                                    <td className="p-4">
                                                        {suggestions[link.id] ? (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                                                    {suggestions[link.id].suggestion}
                                                                </Badge>
                                                                <span className="text-[10px] text-slate-400">({Math.round(suggestions[link.id].confidence * 100)}%)</span>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-violet-600 h-7 text-xs"
                                                                onClick={() => getSuggestion(link.id, link.url)}
                                                            >
                                                                <Zap className="w-3 h-3 mr-1" /> Vorschlag laden
                                                            </Button>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {suggestions[link.id] && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-slate-900 text-white hover:bg-slate-800 h-8"
                                                                    onClick={() => create301(link.url, suggestions[link.id].suggestion, link.id)}
                                                                    disabled={fixingId === link.id}
                                                                >
                                                                    {fixingId === link.id ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <LinkIcon className="w-3 h-3 mr-2" />}
                                                                    Fixen (301)
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" size="sm" className="h-8 text-slate-400">Ignorieren</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="redirects" className="mt-6">
                        <Card className="border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Aktive Weiterleitungen</CardTitle>
                                    <CardDescription>Alle in Shopify konfigurierten 301-Weiterleitungen.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchRedirects}>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Aktualisieren
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-xl overflow-hidden bg-white">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="text-left p-4 font-semibold text-slate-600">Pfad (Alt)</th>
                                                <th className="text-left p-4 font-semibold text-slate-600">Ziel (Neu)</th>
                                                <th className="text-left p-4 font-semibold text-slate-600">Erstellt am</th>
                                                <th className="text-right p-4 font-semibold text-slate-600">Aktion</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {redirects.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                                        Keine aktiven Weiterleitungen gefunden.
                                                    </td>
                                                </tr>
                                            ) : redirects.map((red) => (
                                                <tr key={red.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 font-mono text-xs text-slate-600">{red.path}</td>
                                                    <td className="p-4">
                                                        <Badge variant="secondary" className="bg-slate-100 font-normal">
                                                            {red.target}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-slate-400 text-xs">
                                                        {new Date(red.created_at).toLocaleDateString('de-DE')}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-rose-600 h-8"
                                                            onClick={() => deleteHandler(red.id)}
                                                        >
                                                            Löschen
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="bulk" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <div className="p-2 w-fit rounded-lg bg-emerald-100 mb-2">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <CardTitle>CSV Export</CardTitle>
                                    <CardDescription>Laden Sie alle aktuellen Shopify-Weiterleitungen als CSV-Datei herunter.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full bg-slate-900 text-white" onClick={handleCsvExport}>
                                        Jetzt exportieren
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm border-dashed">
                                <CardHeader>
                                    <div className="p-2 w-fit rounded-lg bg-blue-100 mb-2">
                                        <RefreshCw className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <CardTitle>CSV Import</CardTitle>
                                    <CardDescription>Erstellen Sie hunderte Weiterleitungen gleichzeitig per CSV-Upload.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative group cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={handleCsvImport}
                                        />
                                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl group-hover:border-blue-300 transition-all flex flex-col items-center justify-center text-center">
                                            <span className="text-sm font-medium text-slate-600">Klicken oder Datei hierher ziehen</span>
                                            <span className="text-xs text-slate-400 mt-1">Nur .csv Dateien (Format: path, target)</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        <Card className="border-slate-200 max-w-3xl">
                            <CardHeader>
                                <CardTitle>Monitor-Konfiguration</CardTitle>
                                <CardDescription>Steuern Sie, wie das System mit 404 Fehlern umgeht.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-emerald-500 fill-current" />
                                            Auto-Redirect (High Confidence)
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Erstellt automatisch 301 Umleitungen, wenn die KI-Konfidenz {'>'} 95% liegt.
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white">Inaktiv</Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-bold">Storefront-Crawler Scan</div>
                                        <div className="text-xs text-slate-500">
                                            Wöchentlicher automatischer Scan aller Produkt- und Kollektionsseiten.
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white">Aktiv</Badge>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button className="bg-slate-900 text-white">Einstellungen speichern</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    )
}
