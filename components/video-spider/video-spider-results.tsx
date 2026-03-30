'use client'

import { useState, useEffect } from 'react'
import {
    Download, Search, Filter,
    ExternalLink, Eye, Youtube,
    CheckCircle2, AlertCircle, Clock,
    Monitor, Play, Square, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { VideoSpiderResult, VideoSpiderJob } from '@/types/video-spider-types'
import { cn } from '@/lib/utils'

interface VideoSpiderResultsProps {
    jobId: string
    job: VideoSpiderJob
}

export function VideoSpiderResults({ jobId, job }: VideoSpiderResultsProps) {
    const [results, setResults] = useState<VideoSpiderResult[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'playable' | 'blocked'>('all')

    useEffect(() => {
        loadResults()
    }, [jobId])

    const loadResults = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/video-spider/results?jobId=${jobId}`)
            const data = await res.json()
            if (data.success) {
                setResults(data.results)
            }
        } catch (err) {
            console.error('Failed to load results', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredResults = results.filter(r => {
        const matchesSearch = (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.channelName || '').toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || (filter === 'playable' && r.playable) || (filter === 'blocked' && !r.playable)
        return matchesSearch && matchesFilter
    })

    const exportToExcel = () => {
        // Simple CSV export for now
        const headers = ["Title", "Channel", "URL", "Playable", "Reason", "Player State", "Watch Progress", "Created At"]
        const rows = results.map(r => [
            r.title,
            r.channelName,
            r.inputUrl,
            r.playable ? "TRUE" : "FALSE",
            r.reason,
            r.playerState,
            r.watchProgressProgress,
            r.createdAt
        ])
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `video_spider_results_${jobId}.csv`)
        document.body.appendChild(link)
        link.click()
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Scan Ergebnisse</h3>
                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold uppercase text-[9px]">ID: {jobId.split('-')[0]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1"><Youtube className="w-3.5 h-3.5" /> {job.mode === 'PLAY' ? 'Playback Modus' : 'Verifizierung'}</span>
                            <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> {job.spiderCount} Worker aktiv</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {job.status === 'RUNNING' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    await fetch('/api/video-spider/actions', {
                                        method: 'POST',
                                        body: JSON.stringify({ jobId, action: 'STOP' })
                                    });
                                    loadResults();
                                }}
                                className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                                <Square className="w-4 h-4 mr-2" /> Stoppen
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={loadResults} className="h-9 rounded-xl border-slate-200">
                            <RefreshCw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} />
                        </Button>
                        <Button onClick={exportToExcel} className="h-9 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold uppercase text-[10px] tracking-widest border-none px-4">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Ergebnisse durchsuchen..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 border-slate-200 rounded-xl bg-white focus:ring-slate-900"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >Alle</Button>
                    <Button
                        variant={filter === 'playable' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('playable')}
                        className="rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600"
                    >Playable</Button>
                    <Button
                        variant={filter === 'blocked' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('blocked')}
                        className="rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-600"
                    >Blocked</Button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50 h-10 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 pl-6">Video Details</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 text-center">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 text-center">Watch Test</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3 text-right pr-6">Proof</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && results.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2 animate-pulse">
                                        <RefreshCw className="w-8 h-8 text-slate-200 animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Lade Ergebnisse...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredResults.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center italic text-slate-400 text-sm">Keine Ergebnisse gefunden</TableCell>
                            </TableRow>
                        ) : (
                            filteredResults.map((result) => (
                                <TableRow key={result.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center gap-4">
                                            {result.screenshotUrl ? (
                                                <div className="w-20 aspect-video rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative group/img">
                                                    <img src={result.screenshotUrl} alt="Screenshot" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-20 aspect-video rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                                                    <Youtube className="w-6 h-6 text-slate-200" />
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1 max-w-[300px]">
                                                <span className="font-bold text-slate-900 leading-tight truncate" title={result.title}>{result.title || 'Unknown Title'}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{result.channelName}</span>
                                                    <a href={result.inputUrl} target="_blank" className="text-violet-500 flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Open <ExternalLink className="w-2 h-2" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex flex-col items-center gap-1.5">
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                result.playable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {result.playable ? 'Playable' : (result.reason || 'Blocked')}
                                            </div>
                                            {result.reason && result.reason !== 'ok' && (
                                                <span className="text-[9px] font-bold text-slate-400 capitalize">{result.reason.replace('_', ' ')}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 tabular-nums">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {result.watchProgressProgress?.toFixed(1) || '0.0'}s
                                            </div>
                                            <div className={cn(
                                                "w-12 h-1 rounded-full",
                                                result.playerState === 'playing' ? "bg-emerald-500" : result.playerState === 'error' ? "bg-rose-500" : "bg-slate-100"
                                            )} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                                                    <Monitor className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-xl rounded-xl p-2">
                                                <DropdownMenuItem className="rounded-lg font-bold text-xs" onClick={() => window.open(result.inputUrl, '_blank')}>
                                                    <ExternalLink className="w-4 h-4 mr-2" /> Video öffnen
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg font-bold text-xs">
                                                    <AlertCircle className="w-4 h-4 mr-2" /> Logs anzeigen
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
        </div>
    )
}
