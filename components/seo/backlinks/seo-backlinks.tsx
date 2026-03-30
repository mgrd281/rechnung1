'use client'

import { useState, useEffect } from 'react'
import {
    Activity, ArrowUpRight, ArrowDownRight,
    Link2, Globe, Calendar, ShieldCheck,
    MoreHorizontal, ExternalLink, Search,
    Filter, Download, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Backlink, BacklinkStats, ReferringDomain } from '@/types/backlink-types'
import { BacklinkFinderModal } from './backlink-finder-modal'
import { ScanProgressBar } from './scan-progress-bar'
import { cn } from '@/lib/utils'

export function SeoBacklinks() {
    const [stats, setStats] = useState<BacklinkStats | null>(null)
    const [backlinks, setBacklinks] = useState<Backlink[]>([])
    const [domains, setDomains] = useState<ReferringDomain[]>([])
    const [loading, setLoading] = useState(true)
    const [isFinderOpen, setIsFinderOpen] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [view, setView] = useState<'backlinks' | 'domains'>('backlinks')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [statsRes, linksRes, domainsRes] = await Promise.all([
                fetch('/api/backlinks/stats'),
                fetch('/api/backlinks/list'),
                fetch('/api/backlinks/domains')
            ])

            const statsData = await statsRes.json()
            const linksData = await linksRes.json()
            const domainsData = await domainsRes.json()

            if (statsData.success) setStats(statsData.stats)
            if (linksData.success) setBacklinks(linksData.backlinks)
            if (domainsData.success) setDomains(domainsData.domains)
        } catch (err) {
            console.error('Failed to load backlink data', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Bestätigte Backlinks"
                    value={stats?.totalBacklinks || 0}
                    icon={Link2}
                    trend={+12}
                    description="Verifizierte Verlinkungen"
                />
                <StatCard
                    title="Referring Domains"
                    value={stats?.referringDomains || 0}
                    icon={Globe}
                    trend={+3}
                    description="Einzigartige Domains"
                />
                <StatCard
                    title="Dofollow Anteil"
                    value={`${Math.round(stats?.dofollowPercentage || 0)}%`}
                    icon={ShieldCheck}
                    description="Hochwertige Link-Power"
                />
                <StatCard
                    title="Neue / Verloren"
                    value={`${stats?.newLast30Days || 0} / ${stats?.lostLast30Days || 0}`}
                    icon={Activity}
                    description="Letzte 30 Tage"
                    customValueColor={stats?.newLast30Days && stats.newLast30Days > stats.lostLast30Days ? 'text-emerald-600' : 'text-slate-900'}
                />
            </div>

            {/* Main Content Area */}
            <Card className="border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <Button
                            variant={view === 'backlinks' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('backlinks')}
                            className={cn("rounded-lg text-[10px] font-black uppercase tracking-wider", view === 'backlinks' && "bg-white shadow-sm")}
                        >
                            Backlinks
                        </Button>
                        <Button
                            variant={view === 'domains' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('domains')}
                            className={cn("rounded-lg text-[10px] font-black uppercase tracking-wider", view === 'domains' && "bg-white shadow-sm")}
                        >
                            Referring Domains
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Suchen..." className="pl-9 h-10 border-slate-200 rounded-xl bg-slate-50/50" />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 rounded-xl">
                            <Filter className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 rounded-xl">
                            <Download className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                            className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 font-black text-[10px] uppercase tracking-wider shadow-lg"
                            onClick={() => setIsFinderOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Finder starten
                        </Button>
                    </div>
                </div>

                {view === 'backlinks' ? (
                    <BacklinksTable data={backlinks} loading={loading} isScanning={isScanning} />
                ) : (
                    <DomainsTable data={domains} loading={loading} />
                )}
            </Card>

            <BacklinkFinderModal
                isOpen={isFinderOpen}
                onClose={() => setIsFinderOpen(false)}
                onSuccess={() => {
                    setIsFinderOpen(false)
                    setIsScanning(true)
                    // Data will be reloaded when progress bar completes
                }}
            />

            <ScanProgressBar
                isScanning={isScanning}
                onComplete={() => {
                    setIsScanning(false)
                    loadData()
                }}
            />
        </div>
    )
}

function StatCard({ title, value, icon: Icon, trend, description, customValueColor }: any) {
    return (
        <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-12 h-12" />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{title}</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-3xl font-black tracking-tight", customValueColor || "text-slate-900")}>
                        {value}
                    </span>
                    {trend && (
                        <span className={cn(
                            "text-[10px] font-bold flex items-center gap-0.5",
                            trend > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                <p className="text-[11px] font-medium text-slate-400">{description}</p>
            </div>
        </Card>
    )
}

function BacklinksTable({ data, loading, isScanning }: { data: Backlink[], loading: boolean, isScanning: boolean }) {
    if (loading) return <div className="p-20 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest text-[10px]">Lade Backlinks...</div>

    if (isScanning && data.length === 0) {
        return (
            <div className="p-32 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-white p-4 rounded-full border-2 border-emerald-100 shadow-xl">
                        <Search className="w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">Scan läuft...</h3>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Durchsuche das Web nach Backlinks</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHead className="bg-slate-50/50 border-y border-slate-100 h-10">
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 w-[300px]">Source URL / Referring Domain</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 w-[250px]">Anchor / Target</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 w-[100px]">Type</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 w-[100px]">Status</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 w-[150px]">Confidence</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 text-right">Last Seen</TableCell>
                        <TableCell className="w-10"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">Keine Backlinks gefunden. Starten Sie einen Scan.</TableCell>
                        </TableRow>
                    ) : (
                        data.map((link) => (
                            <TableRow key={link.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-4 align-top">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                                <Globe className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <span className="font-bold text-slate-900 text-sm truncate" title={link.sourceUrl}>
                                                {link.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]}
                                            </span>
                                        </div>
                                        <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-500 hover:text-indigo-600 hover:underline truncate pl-8 block max-w-[280px]">
                                            {link.sourceUrl}
                                        </a>
                                        <div className="pl-8 flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="bg-slate-50 text-slate-500 border border-slate-100 text-[9px] px-1.5 h-5 font-bold">
                                                DR 45
                                            </Badge>
                                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                                {link.sourceDomain}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Anchor</span>
                                            <span className="font-bold text-slate-800 text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block max-w-[200px] truncate">
                                                {link.anchorText || 'No Anchor'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Target</span>
                                            <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[200px]">
                                                {link.targetUrl.replace(/^https?:\/\//, '')}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="align-top py-5">
                                    <Badge variant="outline" className={cn(
                                        "font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm",
                                        link.linkType === 'dofollow' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                    )}>
                                        {link.linkType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="align-top py-5">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "flex w-2 h-2 rounded-full",
                                            link.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-wider",
                                            link.status === 'active' ? "text-slate-700" : "text-rose-600"
                                        )}>{link.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="align-top py-5">
                                    <div className="flex flex-col gap-1 w-24">
                                        <div className="flex justify-between text-[9px] font-black text-slate-500">
                                            <span>Score</span>
                                            <span>{link.confidenceScore}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    link.confidenceScore > 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : link.confidenceScore > 40 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-rose-500 to-rose-400"
                                                )}
                                                style={{ width: `${link.confidenceScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right align-top py-5">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-100">{new Date(link.lastSeenAt).toLocaleDateString()}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">vor {Math.floor((Date.now() - new Date(link.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24))} Tagen</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px] bg-white border-slate-200 shadow-xl rounded-xl p-1.5">
                                            <DropdownMenuItem className="rounded-lg text-[11px] font-bold text-slate-700 focus:bg-slate-50" onClick={() => window.open(link.sourceUrl, '_blank')}>
                                                <ExternalLink className="w-3.5 h-3.5 mr-2 opacity-70" /> Source öffnen
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg text-[11px] font-bold text-slate-700 focus:bg-slate-50">
                                                <ShieldCheck className="w-3.5 h-3.5 mr-2 opacity-70" /> Jetzt verifizieren
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

function DomainsTable({ data, loading }: { data: ReferringDomain[], loading: boolean }) {
    if (loading) return <div className="p-20 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest text-[10px]">Lade Domains...</div>

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHead className="bg-slate-50/50 border-y border-slate-100 h-10">
                    <TableRow>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3">Domain</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3">Backlinks</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3">Verlinkte Seiten</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3">Domain Score</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 text-right">Zuletzt Aktiv</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">Keine Referring Domains gefunden.</TableCell>
                        </TableRow>
                    ) : (
                        data.map((domain) => (
                            <TableRow key={domain.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-900 text-xs">
                                            {domain.domain[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 mb-0.5">{domain.domain}</span>
                                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                                <Globe className="w-3 h-3" /> Domain
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-slate-900 text-white font-black text-[10px] h-6 px-3 rounded-full border-none">
                                        {domain.backlinksCount}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[11px] font-bold text-slate-700">{domain.linkingPagesCount}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-black text-[10px] border border-indigo-100">
                                            DS {domain.internalDomainScore}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-900 text-[11px]">
                                    {new Date(domain.lastSeenAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
