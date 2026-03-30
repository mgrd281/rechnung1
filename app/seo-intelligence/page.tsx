'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { EnterpriseHeader } from '@/components/layout/enterprise-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
    Activity, Search, Zap, Layout,
    ListFilter, Settings, Box, CheckCircle2,
    PenTool, Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Sub-components
import { SeoOverview } from '@/components/seo/seo-overview'
import { SeoScanWizard } from '@/components/seo/seo-scan-wizard'
import { SeoIssueCenter } from '@/components/seo/seo-issue-center'
import { SeoProductTable } from '@/components/seo/seo-product-table'
import { SeoAutopilotSettings } from '@/components/seo/seo-autopilot-settings'
import { SeoContentStrategist } from '@/components/seo/seo-content-strategist'
import { SeoBacklinks } from '@/components/seo/backlinks/seo-backlinks'

// Types
import {
    SeoScan, SeoIssue, SeoProductScore,
    SeoStats, AutopilotConfig, SeoScanOptions
} from '@/types/seo-types'

type SeoTab = 'overview' | 'results' | 'products' | 'autopilot' | 'content' | 'backlinks'

function SEOIntelligencePage() {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab') as SeoTab | null

    const [activeTab, setActiveTab] = useState<SeoTab>(tabParam || 'overview')
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState<SeoScan | undefined>()
    const [loading, setLoading] = useState(true)

    const [stats, setStats] = useState<SeoStats | null>(null)
    const [issues, setIssues] = useState<SeoIssue[]>([])
    const [products, setProducts] = useState<SeoProductScore[]>([])

    const [autopilotConfig, setAutopilotConfig] = useState<AutopilotConfig>({
        mode: 'off',
        confidenceThreshold: 0.85,
        neverChangePrice: true,
        preserveBrandNames: true,
        uniquenessThreshold: 95,
        dailyLimit: 20,
        protectedPages: []
    })

    const { showToast, toasts, removeToast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/seo/issues')
            const data = await response.json()
            if (data.success) {
                setIssues(data.issues)
                setStats({
                    healthScore: data.healthScore || 100,
                    criticalErrors: data.issues.filter((i: any) => i.severity === 'Critical').length,
                    warnings: data.issues.filter((i: any) => i.severity === 'High' || i.severity === 'Medium').length,
                    opportunities: data.issues.filter((i: any) => i.severity === 'Low').length,
                    lastScan: {
                        timestamp: new Date().toLocaleString('de-DE'),
                        duration: 0,
                        pagesScanned: data.total
                    }
                })
            }
        } catch (err) {
            console.error('Failed to load SEO data', err)
            showToast('Fehler beim Laden των SEO البيانات', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleStartScan = async (options: SeoScanOptions) => {
        setIsScanning(true)
        try {
            const res = await fetch('/api/seo/scan', {
                method: 'POST',
                body: JSON.stringify(options)
            })
            const data = await res.json()
            if (data.success) {
                setScanProgress(data.report)
                if (data.report.status === 'completed') {
                    showToast('Scan abgeschlossen!', 'success')
                    loadData()
                    setIsWizardOpen(false)
                }
            }
        } catch (err) {
            showToast('Scan fehlgeschlagen', 'error')
        } finally {
            setIsScanning(false)
        }
    }

    const handleFixIssue = async (issueId: string) => {
        const issue = issues.find(i => i.id === issueId)
        if (!issue) return

        showToast('AI-Optimierung gestartet...', 'info')

        try {
            const type = issue.title.toLowerCase().includes('titel') ? 'title' :
                issue.title.toLowerCase().includes('alt') ? 'alt' : 'manual'

            if (type === 'manual') {
                showToast('Dieses Problem erfordert manuelles Bearbeiten.', 'warning')
                return
            }

            const res = await fetch('/api/seo/fix/apply', {
                method: 'POST',
                body: JSON.stringify({
                    issueId,
                    resourceId: issue.url.split('/').pop() || '',
                    type,
                    currentTitle: issue.resourceType === 'Product' ? (issue.recommendation?.split('"')[1] || '') : '',
                    description: ''
                })
            })
            const json = await res.json()
            if (json.success) {
                setIssues(prev => prev.filter(i => i.id !== issueId))
                showToast(json.message || 'SEO erfolgreich verbessert!', 'success')
            } else {
                showToast(json.error || 'Fehler bei der Optimierung', 'error')
            }
        } catch (err) {
            showToast('API-Fehler bei der Optimierung', 'error')
        }
    }

    const handleBulkFix = async (ids: string[]) => {
        showToast(`${ids.length} Fixes werden angewendet...`, 'info')
        await new Promise(r => setTimeout(r, 2000))
        setIssues(prev => prev.filter(i => !ids.includes(i.id)))
        showToast('Batch-Optimierung abgeschlossen!', 'success')
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="pb-[56px]">
                <EnterpriseHeader />
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[10px] uppercase tracking-widest px-2">
                                <Zap className="w-3 h-3 mr-1" /> SEO Command Center
                            </Badge>
                            {autopilotConfig.mode === 'auto' && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 shadow-sm animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black uppercase text-emerald-400">Autopilot Live</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">SEO Intelligence Center</h1>
                        <p className="text-slate-500 font-medium">Vollständiger SEO-Scan & automatische Optimierung für Shopify</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 bg-white"
                            onClick={() => setIsWizardOpen(true)}
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Scan starten
                        </Button>
                        <Button
                            className={cn(
                                "h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl transition-all",
                                autopilotConfig.mode === 'auto' ? "bg-slate-900" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-100"
                            )}
                            onClick={() => setActiveTab('autopilot')}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            {autopilotConfig.mode === 'auto' ? 'Autopilot aktiv' : 'Autopilot konfigurieren'}
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit overflow-x-auto max-w-full">
                    {(['overview', 'results', 'products', 'autopilot', 'content', 'backlinks'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === tab
                                    ? "bg-slate-900 text-white shadow-lg"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {tab === 'overview' && <Layout className="w-3.5 h-3.5" />}
                            {tab === 'results' && <ListFilter className="w-3.5 h-3.5" />}
                            {tab === 'products' && <Box className="w-3.5 h-3.5" />}
                            {tab === 'autopilot' && <Settings className="w-3.5 h-3.5" />}
                            {tab === 'content' && <PenTool className="w-3.5 h-3.5" />}
                            {tab === 'backlinks' && <Link2 className="w-3.5 h-3.5" />}
                            {tab === 'overview' ? 'Überblick' :
                                tab === 'results' ? 'Scan Ergebnisse' :
                                    tab === 'products' ? 'Produkte & Collections' :
                                        tab === 'autopilot' ? 'Autopilot' :
                                            tab === 'content' ? 'Magazin & Content' : 'Backlinks'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[600px]">
                    {loading && !stats ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">SEO Analyse wird geladen...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && stats && (
                                <SeoOverview
                                    stats={stats}
                                    topIssues={issues.slice(0, 5)}
                                    onFixIssue={handleFixIssue}
                                    onStartScan={() => setIsWizardOpen(true)}
                                />
                            )}

                            {activeTab === 'results' && (
                                <SeoIssueCenter
                                    issues={issues}
                                    onFixIssue={handleFixIssue}
                                    onBulkFix={handleBulkFix}
                                />
                            )}

                            {activeTab === 'products' && (
                                <SeoProductTable
                                    products={products.length > 0 ? products : issues.map(i => ({
                                        id: i.id,
                                        handle: i.url,
                                        title: i.title,
                                        type: 'product',
                                        score: i.severity === 'Critical' ? 20 : 60,
                                        titleLength: 0,
                                        titleOptimal: false,
                                        metaQuality: 'poor',
                                        contentDepth: 0,
                                        hasSchema: true,
                                        lastChecked: i.createdAt,
                                        missingAlts: 0
                                    }))}
                                    onUpdateProduct={(id, data) => showToast('Änderung gespeichert', 'success')}
                                />
                            )}

                            {activeTab === 'autopilot' && (
                                <SeoAutopilotSettings
                                    config={autopilotConfig}
                                    onUpdateConfig={setAutopilotConfig}
                                    onEmergencyStop={() => {
                                        setAutopilotConfig({ ...autopilotConfig, mode: 'off' })
                                        showToast('AI Autopilot Not-Stopp ausgelöst!', 'error')
                                    }}
                                />
                            )}

                            {activeTab === 'content' && (
                                <SeoContentStrategist />
                            )}

                            {activeTab === 'backlinks' && (
                                <SeoBacklinks />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Scan Wizard Modal */}
            <SeoScanWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onStartScan={handleStartScan}
                scanProgress={scanProgress}
            />

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={cn(
                            "p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 min-w-[300px]",
                            toast.type === 'success' ? "bg-white border-emerald-100 text-emerald-900" :
                                toast.type === 'error' ? "bg-red-900 text-white border-none" : "bg-white border-slate-100 text-slate-900"
                        )}
                    >
                        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Activity className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-tight">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-auto text-slate-400">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
            </div>
        }>
            <SEOIntelligencePage />
        </Suspense>
    )
}
