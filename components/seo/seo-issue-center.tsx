'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, Filter, ArrowUpDown, ChevronRight,
    Zap, ExternalLink, Trash2, Info, Eye,
    ChevronDown, CheckCircle2, AlertCircle, Sparkles, Box, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SeoIssue, SeoSeverity, SeoCategory } from '@/types/seo-types'

interface SeoIssueCenterProps {
    issues: SeoIssue[]
    onFixIssue: (issueId: string) => void
    onBulkFix: (issueIds: string[]) => void
}

export function SeoIssueCenter({ issues, onFixIssue, onBulkFix }: SeoIssueCenterProps) {
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
    const [filterSeverity, setFilterSeverity] = useState<SeoSeverity | 'All'>('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<string[]>([])

    const filteredIssues = issues.filter(issue => {
        const matchesSeverity = filterSeverity === 'All' || issue.severity === filterSeverity
        const matchesSearch = issue.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSeverity && matchesSearch
    })

    const selectedIssue = issues.find(i => i.id === selectedIssueId)

    const toggleRow = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id])
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 h-auto min-h-[600px]">
            {/* Left Sidebar Filters */}
            <div className="w-full lg:w-72 space-y-8 flex-shrink-0">
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] px-2 flex items-center gap-2">
                        <Filter className="w-3 h-3" /> PRIORITÄT
                    </h3>
                    <div className="space-y-1.5">
                        {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
                            <button
                                key={sev}
                                onClick={() => setFilterSeverity(sev as any)}
                                className={cn(
                                    "w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                                    filterSeverity === sev ? "bg-slate-900 text-white shadow-xl translate-x-1" : "text-slate-500 hover:bg-white hover:shadow-sm"
                                )}
                            >
                                <span>{sev === 'All' ? 'Alle anzeigen' : sev === 'Critical' ? 'Kritisch' : sev}</span>
                                <Badge variant="outline" className={cn(
                                    "text-[9px] border-none font-black h-5 px-2",
                                    filterSeverity === sev ? "bg-white/10 text-white" : "bg-slate-50 text-slate-400"
                                )}>
                                    {sev === 'All' ? issues.length : issues.filter(i => i.severity === sev).length}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">Kategorien</h3>
                    <div className="grid grid-cols-1 gap-2 px-2">
                        {['Technical', 'On-Page', 'Content', 'Performance'].map((cat) => (
                            <div key={cat} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-100 group">
                                <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <Info className="w-3 h-3" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content: Table */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-[600px]">
                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden flex-1 flex flex-col">
                    <CardHeader className="px-10 py-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-4 flex-1 max-w-xl">
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    className="h-12 pl-12 bg-slate-50 border-none rounded-2xl text-[11px] font-bold shadow-inner focus:ring-slate-900/5 transition-all"
                                    placeholder="Suche nach URLs oder SEO-Problemen..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {selectedRows.length > 0 && (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedRows.length} Markiert</span>
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase h-10 px-6 rounded-2xl shadow-xl shadow-emerald-50 transition-all"
                                    onClick={() => onBulkFix(selectedRows)}
                                >
                                    <Zap className="w-3 h-3 mr-2" /> Markierte Bulk-Fixen
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xl z-10 transition-all">
                                <tr>
                                    <th className="px-10 py-5 w-14">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-200 text-slate-900 focus:ring-slate-900"
                                                onChange={(e) => setSelectedRows(e.target.checked ? filteredIssues.map(i => i.id) : [])}
                                                checked={selectedRows.length === filteredIssues.length && filteredIssues.length > 0}
                                            />
                                        </div>
                                    </th>
                                    <th className="px-5 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest font-[system-ui]">URL / Resource</th>
                                    <th className="px-5 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest font-[system-ui]">SEO Issue Description</th>
                                    <th className="px-5 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest font-[system-ui]">Status</th>
                                    <th className="px-5 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest font-[system-ui]">Intelligence</th>
                                    <th className="px-10 py-5 text-right w-14"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50/50">
                                {filteredIssues.map((issue) => (
                                    <tr
                                        key={issue.id}
                                        className={cn(
                                            "group cursor-pointer hover:bg-slate-50/30 transition-all border-l-4 border-l-transparent",
                                            selectedIssueId === issue.id && "bg-slate-50/80 border-l-emerald-500 shadow-sm"
                                        )}
                                        onClick={() => setSelectedIssueId(issue.id)}
                                    >
                                        <td className="px-10 py-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-200 text-slate-900 focus:ring-slate-900"
                                                    checked={selectedRows.includes(issue.id)}
                                                    onChange={() => toggleRow(issue.id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-6">
                                            <div className="flex flex-col gap-1 max-w-[220px]">
                                                <span className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{issue.url}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Box className="w-2.5 h-2.5" /> {issue.resourceType}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6">
                                            <span className="text-xs font-bold text-slate-600 block max-w-[300px] leading-relaxed group-hover:text-slate-900 transition-colors uppercase italic">{issue.title}</span>
                                        </td>
                                        <td className="px-5 py-6">
                                            <Badge className={cn(
                                                "text-[9px] font-black uppercase border-none px-3 h-6",
                                                issue.severity === 'Critical' ? "bg-red-100 text-red-600 shadow-sm animate-pulse" :
                                                    issue.severity === 'High' ? "bg-orange-100 text-orange-600" :
                                                        issue.severity === 'Medium' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {issue.severity === 'Critical' ? 'KRITISCH' : issue.severity === 'High' ? 'WARNUNG' : 'OPTIMIERUNG'}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-6">
                                            <div className="flex items-center gap-2">
                                                {issue.fixType === 'auto' ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase h-5">
                                                        <Sparkles className="w-2.5 h-2.5 mr-1" /> AI Fix Ready
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase h-5">Manual Fix</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-slate-900 group-hover:text-white">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Right Details Intelligence Panel */}
            {selectedIssue && (
                <div className="w-full lg:w-[450px] animate-in slide-in-from-right-8 duration-500">
                    <Card className="border-none shadow-[20px_40px_80px_-15px_rgba(0,0,0,0.1)] bg-white rounded-[3rem] overflow-hidden sticky top-0 h-fit border border-slate-100">
                        <CardHeader className="bg-slate-900 text-white p-10 pb-16 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 h-6">
                                    {selectedIssue.category} ANALYSE
                                </Badge>
                                <button onClick={() => setSelectedIssueId(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <CardTitle className="text-2xl font-black uppercase leading-tight italic relative z-10">{selectedIssue.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 -mt-10 bg-white rounded-t-[3rem] relative z-20 space-y-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                    <Eye className="w-3.5 h-3.5" /> Problem-Details
                                </p>
                                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <p className="text-[13px] text-slate-600 font-bold leading-relaxed">{selectedIssue.issue}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-emerald-500" /> K.I. Lösungsvorschlag
                                </p>
                                <div className="p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50 space-y-4 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                        <Sparkles className="w-12 h-12 text-emerald-600" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-emerald-900 tracking-widest">Optimierungs-Plan</p>
                                    </div>
                                    <p className="text-[14px] text-slate-800 font-black leading-relaxed italic uppercase tracking-tight">
                                        "{selectedIssue.recommendation}"
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6">
                                <Button
                                    className="w-full h-16 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-slate-200 border-none hover:scale-[1.02] active:scale-95 transition-all group"
                                    onClick={() => onFixIssue(selectedIssue.id)}
                                >
                                    <Zap className="w-5 h-5 mr-3 text-emerald-400 group-hover:animate-bounce" />
                                    {selectedIssue.fixType === 'auto' ? 'JETZT AUTO-OPTIMIEREN' : 'MANUELL BEHEBEN'}
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="h-14 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors">
                                        <ExternalLink className="w-3.5 h-3.5 mr-2" /> VORSCHAU
                                    </Button>
                                    <Button variant="outline" className="h-14 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors">
                                        IGNORIEREN
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

