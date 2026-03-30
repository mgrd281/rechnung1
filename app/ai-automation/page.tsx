'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Bot, Zap, Activity, TrendingUp, DollarSign,
    Plus, History, ShieldAlert, Play, Pause,
    Settings2, ChevronRight, Sparkles, Brain, Layout,
    Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnterpriseHeader } from '@/components/layout/enterprise-header'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast, Toast } from '@/components/ui/toast'
import { AutomationCanvas } from '@/components/ai/automation-canvas'

import { ErrorBoundary } from '@/components/error-boundary'

function AIAutomationPage() {
    const [automation, setAutomation] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'automations' | 'content' | 'settings'>('overview')
    const [status, setStatus] = useState<'active' | 'paused'>('active')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [articles, setArticles] = useState<any[]>([])
    const [blogs, setBlogs] = useState<any[]>([])
    const [currentJob, setCurrentJob] = useState<any>(null)
    const [shopDomain, setShopDomain] = useState('')
    const { showToast, toasts, removeToast } = useToast()

    const loadAutomation = async () => {
        try {
            const response = await fetch('/api/ai/automation')
            const data = await response.json()
            if (data.success) {
                setAutomation(data.automation)
                setStatus(data.automation.status === 'ACTIVE' ? 'active' : 'paused')
                setArticles(data.automation.articles || [])
                setBlogs(data.blogs || [])
                setShopDomain(data.shopDomain || '')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAutomation()
    }, [])

    const handleDeleteArticle = async (blogId: string, articleId: string) => {
        if (!confirm('Sind Sie sicher, dass Sie diesen Artikel löschen möchten?')) return
        try {
            const res = await fetch('/api/ai/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_ARTICLE', blogId, articleId })
            })
            const data = await res.json()
            if (data.success) {
                showToast('Artikel gelöscht', 'success')
                setArticles(articles.filter(a => a.id !== articleId))
            }
        } catch (err) {
            showToast('Fehler beim Löschen', 'error')
        }
    }

    if (loading) return <LoadingState />
    if (error) return <ErrorCard message={error} onRetry={() => window.location.reload()} />

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="pb-[56px]">
                <EnterpriseHeader />
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-500">
                {/* Enterprise Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">AI Automation Center</h1>
                        <p className="text-slate-500 font-medium mt-1">Ihre KI erstellt und veröffentlicht Inhalte automatisch.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-10 px-4 font-black text-[10px] uppercase tracking-widest border-slate-200">
                            Logs
                        </Button>
                        <Button className="h-10 px-6 font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200">
                            Neue Automation
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
                    {[
                        { id: 'overview', label: 'Überblick' },
                        { id: 'automations', label: 'Automationen' },
                        { id: 'content', label: 'Inhalte' },
                        { id: 'settings', label: 'Einstellungen' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pt-2">
                    {activeTab === 'overview' && <OverviewTab automation={automation} status={status} articles={articles} />}
                    {activeTab === 'automations' && <AutomationsTab automation={automation} />}
                    {activeTab === 'content' && <ContentTab automation={automation} articles={articles} blogs={blogs} showToast={showToast} setArticles={setArticles} onDelete={handleDeleteArticle} shopDomain={shopDomain} />}
                    {activeTab === 'settings' && <SettingsTab automation={automation} />}
                </div>
            </main>

            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(t => <Toast key={t.id} id={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
            </div>
        </div>
    )
}

// --- SUB-COMPONENTS ---

function OverviewTab({ automation, status }: any) {
    const kpis = [
        { label: 'Veröffentlichte Artikel', value: '142', trend: '+12%', icon: Layout },
        { label: 'Aktive Automationen', value: '3', trend: 'Stabil', icon: Zap },
        { label: 'Organischer Traffic', value: '12.4k', trend: '+24%', icon: TrendingUp },
        { label: 'Content Umsatz', value: '€4.290', trend: '+18%', icon: DollarSign }
    ]

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">{kpi.trend}</Badge>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-slate-900">{kpi.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl",
                            status === 'active' ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
                        )}>
                            <Bot className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase border-none",
                                    status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500"
                                )}>
                                    Status: {status === 'active' ? 'Aktiv' : 'Pausiert'}
                                </Badge>
                                {status === 'active' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight italic">KI Content-Zentrale</h2>
                            <p className="text-slate-400 text-sm font-medium">Ihre KI analysiert Trends und erstellt automatisch Fachartikel.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 bg-white/5 p-6 rounded-3xl border border-white/5">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Letzte Ausführung</p>
                            <p className="text-sm font-bold">{new Date(automation?.lastRun).toLocaleTimeString('de-DE')} Uhr</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Nächste Veröffentlichung</p>
                            <p className="text-sm font-bold text-emerald-400">In 4 Stunden</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function AutomationsTab({ automation }: any) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Name', 'Typ', 'Status', 'Zeitplan', 'Letzte Ausführung', 'Aktion'].map(h => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-6 text-sm font-black text-slate-900 uppercase">{automation?.name || 'Shopify Growth Bot'}</td>
                                <td className="px-6 py-6 text-xs text-slate-500 font-bold uppercase">Blog Marketing</td>
                                <td className="px-6 py-6"><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase">Aktiv</Badge></td>
                                <td className="px-6 py-6 text-xs text-slate-500 font-bold uppercase">Täglich 09:00</td>
                                <td className="px-6 py-6 text-xs text-slate-500 font-bold">Vor 12 Min</td>
                                <td className="px-6 py-6">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"><Settings2 className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600"><Play className="w-4 h-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Workflow Builder
                </h3>
                <Card className="border-none shadow-xl bg-white rounded-3xl p-10">
                    <div className="flex flex-col items-center gap-8">
                        <WorkflowStep number={1} icon={Activity} title="Quelle" detail="Marktplatz Trends & Konkurrenz" />
                        <div className="w-px h-10 bg-slate-100" />
                        <WorkflowStep number={2} icon={Search} title="Recherche" detail="Keywords + Trend-Analyse" />
                        <div className="w-px h-10 bg-slate-100" />
                        <WorkflowStep number={3} icon={Sparkles} title="Schreiben" detail="Blogartikel (Lock: DEUTSCH)" />
                        <div className="w-px h-10 bg-slate-100" />
                        <WorkflowStep number={4} icon={ShieldAlert} title="Optimieren" detail="SEO + Expert Quality Gate" />
                        <div className="w-px h-10 bg-slate-100" />
                        <WorkflowStep number={5} icon={Layout} title="Veröffentlichen" detail="Shopify Blogs (Auto-Post)" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

function WorkflowStep({ number, icon: Icon, title, detail }: any) {
    return (
        <div className="flex items-center gap-6 w-full max-w-xl group">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xl relative z-10 group-hover:bg-violet-600 transition-colors">
                {number}
            </div>
            <div className="flex-1 p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between group-hover:bg-white group-hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-slate-400 group-hover:text-violet-600 shadow-sm">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{detail}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-200 hover:text-slate-900 transition-colors">
                    <Settings2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

function ContentTab({ automation, articles, blogs, showToast, setArticles, onDelete, shopDomain }: any) {
    const [topic, setTopic] = useState('')
    const [url, setUrl] = useState('')
    const [mode, setMode] = useState<'TOPIC' | 'URL'>('TOPIC')
    const [isPublishing, setIsPublishing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isDeepModalOpen, setIsDeepModalOpen] = useState(false)

    // Deep Research Options
    const [options, setOptions] = useState({
        length: 'Standard (1500–2200)',
        tone: 'Magazin',
        audience: 'Fortgeschritten',
        keywords: '',
        includeImages: true,
        imagePolicy: 'Licensed', // Licensed, Source
        publishMode: 'Draft', // Draft, Publish
        blogId: blogs?.[0]?.id || ''
    })

    // AI Progress Steps
    const [currentStep, setCurrentStep] = useState(0)
    const steps = [
        "Recherche (Quellen sammeln)",
        "Gliederung (Outline)",
        "Schreiben (Draft)",
        "Faktencheck & Quellen",
        "Bilder & Alt-Texte",
        "SEO Finalisierung",
        "Veröffentlichung"
    ]

    // Real-time progress polling
    useEffect(() => {
        let pollInterval: any
        if (isPublishing) {
            pollInterval = setInterval(async () => {
                try {
                    const res = await fetch('/api/ai/automation')
                    const data = await res.json()
                    if (data.success && data.automation.activeJob) {
                        const step = data.automation.activeJob.progressStep
                        // progressStep is 1-indexed in DB, map to 0-indexed steps
                        if (step > 0 && step <= steps.length) {
                            setCurrentStep(step - 1)
                        }
                    }
                } catch (e) { }
            }, 4000) // Poll every 4s for smoother progress
        }
        return () => clearInterval(pollInterval)
    }, [isPublishing])

    const handleDeepPublish = async () => {
        if (!topic.trim()) {
            showToast('Bitte ein Thema eingeben', 'error')
            return
        }

        setIsPublishing(true)
        setCurrentStep(0)
        setIsDeepModalOpen(false)

        // Progress is now handled by polling the activeJob progressStep from the DB

        try {
            const res = await fetch('/api/ai/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_BLOG_DEEP',
                    topic: mode === 'TOPIC' ? topic : '',
                    url: mode === 'URL' ? url : '',
                    mode,
                    options: {
                        ...options,
                        blogId: options.blogId || blogs?.[0]?.id
                    }
                })
            })

            const data = await res.json()
            if (data.success) {
                setCurrentStep(steps.length - 1) // Set to last step on success
                showToast('Masterpiece erfolgreich veröffentlicht!', 'success')
                setTopic('')
                // Refresh list
                const refresh = await fetch('/api/ai/automation')
                const refreshData = await refresh.json()
                if (refreshData.success) setArticles(refreshData.automation.articles)
            } else {
                throw new Error(data.error || 'Fehler beim Generieren')
            }
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            // Keep the progress visible for a moment to see the final step
            setTimeout(() => {
                setIsPublishing(false)
                setCurrentStep(0)
            }, 3000)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const isDisabled = (mode === 'TOPIC' ? !topic.trim() : !url.trim()) || isPublishing
            if (!isDisabled) {
                handleDeepPublish()
            }
        }
    }

    const filteredArticles = articles.filter((a: any) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Deep Research Modal */}
            {isDeepModalOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-200">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Deep Research Engine</h2>
                            </div>
                            <Button variant="ghost" onClick={() => setIsDeepModalOpen(false)} className="rounded-full w-10 h-10 p-0 text-slate-400 hover:text-slate-900 font-black">X</Button>
                        </div>

                        <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                                <button
                                    onClick={() => setMode('TOPIC')}
                                    className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", mode === 'TOPIC' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
                                >
                                    Topic Mode
                                </button>
                                <button
                                    onClick={() => setMode('URL')}
                                    className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", mode === 'URL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
                                >
                                    URL Mode
                                </button>
                            </div>

                            {mode === 'TOPIC' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Hauptthema / Headline</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full h-16 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 font-bold text-lg focus:outline-none focus:border-violet-600 transition-all text-slate-900"
                                        placeholder="Das ultimative Thema für 2026..."
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Source URL (Analysis)</label>
                                    <input
                                        autoFocus
                                        type="url"
                                        className="w-full h-16 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 font-bold text-lg focus:outline-none focus:border-violet-600 transition-all text-slate-900"
                                        placeholder="https://beispiel.de/artikel-zu-rewriten"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <OptionSelect label="Ziel-Blog" value={blogs.find((b: any) => b.id === options.blogId)?.title || blogs?.[0]?.title || 'Select Blog'} options={blogs.map((b: any) => b.title)} onChange={v => setOptions({ ...options, blogId: blogs.find((b: any) => b.title === v)?.id })} />
                                <OptionSelect label="Artikellänge" value={options.length} options={['Kurz (1200)', 'Standard (2000)', 'Enterprise (3500)']} onChange={v => setOptions({ ...options, length: v })} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">SEO Fokus-Keywords</label>
                                <input
                                    type="text"
                                    className="w-full h-14 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 font-bold focus:outline-none focus:border-violet-600 transition-all text-slate-900"
                                    placeholder="Keyword 1, Keyword 2..."
                                    value={options.keywords}
                                    onChange={e => setOptions({ ...options, keywords: e.target.value })}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <OptionSelect label="Tonfall" value={options.tone} options={['Magazin', 'Ratgeber', 'Tech', 'News']} onChange={v => setOptions({ ...options, tone: v })} />
                                <OptionSelect label="Publish Mode" value={options.publishMode} options={['Draft', 'Publish']} onChange={v => setOptions({ ...options, publishMode: v })} />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-emerald-500 rounded-lg text-white"><Layout className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-slate-900">Bilder & Illustrationen</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recherche legaler Web-Bilder</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <select
                                        className="bg-transparent text-[10px] font-black uppercase outline-none border-b-2 border-slate-200"
                                        value={options.imagePolicy}
                                        onChange={e => setOptions({ ...options, imagePolicy: e.target.value })}
                                    >
                                        <option value="Licensed">Licensed only</option>
                                        <option value="Source">Source if legal</option>
                                    </select>
                                    <Switch checked={options.includeImages} onCheckedChange={v => setOptions({ ...options, includeImages: v })} />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 border-t border-slate-100">
                            <Button
                                onClick={handleDeepPublish}
                                disabled={(mode === 'TOPIC' ? !topic.trim() : !url.trim()) || isPublishing}
                                className="w-full h-16 bg-slate-900 hover:bg-violet-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-4"
                            >
                                <Sparkles className="w-5 h-5" /> {mode === 'URL' ? 'URL analysieren & Umschreiben' : 'Deep Research & Publish starten'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spotlight Search Overlay (Existing) */}
            {
                isSearchOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200" onClick={() => setIsSearchOpen(false)}>
                        <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                                <Search className="w-6 h-6 text-slate-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Nach Tutorials, Trends oder Artikeln suchen..."
                                    className="w-full h-12 bg-transparent text-xl font-bold focus:outline-none placeholder:text-slate-300"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
                                {filteredArticles.length > 0 ? filteredArticles.slice(0, 5).map((a: any) => (
                                    <div key={a.id} className="p-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center group cursor-pointer" onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}>
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">AI</div>
                                            <div>
                                                <p className="text-sm font-black uppercase text-slate-900">{a.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{new Date(a.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-900" />
                                    </div>
                                )) : (
                                    <div className="p-20 text-center">
                                        <p className="text-slate-400 font-bold uppercase text-xs">Keine Ergebnisse gefunden</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESC zum Schließen</p>
                                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase" onClick={() => setIsSearchOpen(false)}>Abbrechen</Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Manual Publisher Entry Section */}
            <Card className="border-none shadow-xl bg-white rounded-3xl p-10 mt-2 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-white group-hover:bg-violet-600 transition-colors">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 italic">Enterprise Master Publisher</h3>
                            <p className="text-slate-500 font-medium text-sm italic">50-Year Expert Writing Style & Legal Data Sourcing.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 border border-slate-100 font-black text-[10px] uppercase tracking-widest gap-2" onClick={() => setIsSearchOpen(true)}>
                            <Search className="w-4 h-4" /> Bibliothek durchsuchen
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                readOnly
                                onClick={() => setIsDeepModalOpen(true)}
                                type="text"
                                placeholder="Hier klicken، um Deep Research zu konfigurieren..."
                                className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-slate-50 font-black text-slate-400 cursor-pointer hover:border-violet-200 transition-all text-lg shadow-inner"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase">Online Recherche Ready</Badge>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsDeepModalOpen(true)}
                            className="h-16 px-12 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-300 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Konfigurieren
                        </Button>
                    </div>

                    {isPublishing && (
                        <div className="p-10 rounded-[3rem] bg-slate-900 text-white space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl shadow-indigo-200 relative overflow-hidden">
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Deep Intelligence Engine</h4>
                                    <h2 className="text-xl font-black italic tracking-tight">{topic}</h2>
                                </div>
                                <div className="flex flex-col items-end">
                                    <Badge className="bg-violet-500 text-white border-none font-black text-[10px] px-4 py-1 uppercase animate-pulse mb-2">Processing Excellence</Badge>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">Estimated time: 4-6 minutes</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                {steps.map((s, i) => (
                                    <div key={i} className={cn(
                                        "p-4 rounded-2xl border transition-all duration-700",
                                        i === currentStep ? "border-violet-500 bg-violet-500/10 translate-y-[-4px]" : i < currentStep ? "border-emerald-500 bg-emerald-500/5" : "border-white/5 bg-white/5 opacity-40"
                                    )}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black",
                                                i < currentStep ? "bg-emerald-500 text-white" : "bg-white text-slate-900"
                                            )}>
                                                {i < currentStep ? "✓" : i + 1}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest">{s.split(' ')[0]}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">{s}</p>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed text-center relative z-10">
                                Wir schreiben gerade eines der besten Artikel im gesamten deutschen Web. Bitte haben Sie Geduld.
                            </p>
                            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                        </div>
                    )}
                </div>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Layout className="w-4 h-4" /> Content Bibliothek (Live)
                    </h3>
                    <p className="text-[10px] font-black text-slate-300 uppercase">{articles.length} Gesamtartikel</p>
                </div>
                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Titel', 'Blog', 'Status', 'SEO Score', 'Datum', 'Aktion'].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {articles.length > 0 ? articles.map((a: any) => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-black">AI</div>
                                                <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[300px]">{a.title}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <Badge variant="outline" className="border-slate-200 text-slate-400 text-[9px] font-black uppercase">{a.blogHandle}</Badge>
                                        </td>
                                        <td className="px-6 py-6"><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase">Veröffentlicht</Badge></td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[94%]" />
                                                </div>
                                                <span className="text-[10px] font-black">94</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-[10px] text-slate-400 font-bold uppercase">{new Date(a.created_at).toLocaleDateString('de-DE')}</td>
                                        <td className="px-6 py-6">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" className="text-[10px] font-black text-blue-600 hover:bg-blue-50" onClick={() => window.open(a.previewUrl || `https://${shopDomain}/blogs/${a.blogHandle}/${a.handle}`, '_blank')}>ANSEHEN</Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[10px] font-black text-red-600 hover:bg-red-50"
                                                    onClick={() => onDelete(a.blogId, a.id)}
                                                >
                                                    LÖSCHEN
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <p className="text-slate-400 font-bold uppercase text-xs">Keine Artikel gefunden</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}

function SettingsTab({ automation }: any) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-10">
                <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] p-10 overflow-hidden relative">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                        <Brain className="w-4 h-4" /> Brand Voice Einstellungen
                    </h3>
                    <div className="space-y-8 relative z-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Sprache</p>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase">Deutsch (Lock)</Badge>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tonfall</p>
                                <p className="text-sm font-black uppercase">Professionell</p>
                            </div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Zielgruppe</p>
                            <p className="text-sm font-black uppercase">B2B / Enterprise Entscheider</p>
                        </div>
                        <Button className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest rounded-2xl">
                            Markenprofil bearbeiten
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                </Card>
            </div>

            <div className="space-y-10">
                <Card className="border-none shadow-sm bg-white rounded-3xl p-10">
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-8 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" /> Smart Autopilot Regeln
                    </h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Keine doppelten Themen', desc: 'Prüfhistorie vor Generierung', status: true },
                            { label: 'Produkte automatisch verlinken', desc: 'Shopify Product Search API', status: true },
                            { label: 'Nur veröffentlichen wenn SEO > 80', desc: 'Qualitäts-Gate aktiv', status: true },
                            { label: 'Content AI Expert-Mode', desc: 'Deep Research enabled', status: true }
                        ].map((rule, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-900">{rule.label}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{rule.desc}</p>
                                </div>
                                <Switch checked={rule.status} />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">KI-Kern wird geladen...</p>
            </div>
        </div>
    )
}

function ErrorCard({ message, onRetry }: any) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-2xl bg-white rounded-[2.5rem] p-10 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <ShieldAlert className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Systemausfall</h2>
                <p className="text-sm text-slate-500 mt-2 mb-8 font-medium">Teil konnte nicht geladen werden.<br />{message}</p>
                <Button onClick={onRetry} className="h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl w-full shadow-2xl shadow-slate-200 transition-all">
                    System Neu laden
                </Button>
            </Card>
        </div>
    )
}

const StatusCheck = ({ className }: { className?: string }) => <Zap className={className} />
const NodeSearch = ({ className }: { className?: string }) => <Bot className={className} />

function OptionSelect({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                            value === opt
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <ErrorBoundary>
            <Suspense fallback={
                <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                </div>
            }>
                <AIAutomationPage />
            </Suspense>
        </ErrorBoundary>
    )
}
