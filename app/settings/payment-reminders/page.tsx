'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, RefreshCcw, Layout, Settings2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'

import { RecoveryDashboard } from '@/components/settings/recovery/recovery-dashboard'
import { TimelineBuilder } from '@/components/settings/recovery/timeline-builder'
import { TemplateManager } from '@/components/settings/recovery/template-manager'
import { RulesPerformance } from '@/components/settings/recovery/rules-performance'

export default function PaymentRemindersSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    const [vorkasse, setVorkasse] = useState<any>({ enabled: false })
    const [rechnung, setRechnung] = useState<any>({ enabled: true })
    const [stats, setStats] = useState<any>({ openAmount: 0, recoveredAmount: 0, activeRuns: 0, successRate: 0, trends: {}, series: [] })
    const [funnel, setFunnel] = useState<any[]>([])

    useEffect(() => {
        loadSettings()
        loadStats()
    }, [])

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings/payment-reminders')
            if (res.ok) {
                const data = await res.json()
                if (data.vorkasse) setVorkasse(data.vorkasse)
                if (data.rechnung) setRechnung(data.rechnung)
            }
        } catch (error) {
            console.error('Failed to load settings', error)
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const res = await fetch('/api/settings/recovery/stats')
            if (res.ok) {
                const data = await res.json()
                if (data.stats) setStats(data.stats)
                if (data.funnel) setFunnel(data.funnel)
            }
        } catch (error) {
            console.error('Failed to load stats', error)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings/payment-reminders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vorkasse, rechnung })
            })
            if (res.ok) showToast('Strategie erfolgreich aktiviert', 'success')
            else throw new Error('Failed')
        } catch (error) {
            showToast('Fehler beim Speichern', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    const headerActions = (
        <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border ${rechnung.enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <div className={`w-2 h-2 rounded-full ${rechnung.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {rechnung.enabled ? 'RECOVERY ACTIVE' : 'RECOVERY PAUSED'}
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 font-bold h-10 px-6">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'SPERT...' : 'STRATEGIE AKTIVIEREN'}
            </Button>
        </div>
    )

    const isEverythingDisabled = !vorkasse.enabled && !rechnung.enabled

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Revenue Recovery Center"
                subtitle="High-Performance Automatisierung für Ihr Forderungsmanagement."
                actions={headerActions}
            />

            {isEverythingDisabled ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                        <Settings2 className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Automatisches Mahnwesen ist deaktiviert</h2>
                        <p className="text-slate-500 font-medium">Reagieren Sie automatisch auf Zahlungsverzug und steigern Sie Ihre Liquidität durch intelligente Recovery-Strategien.</p>
                    </div>
                    <Button
                        onClick={() => {
                            setRechnung({ ...rechnung, enabled: true })
                            handleSave()
                        }}
                        className="bg-slate-900 hover:bg-slate-800 font-black h-12 px-8 rounded-xl shadow-xl shadow-slate-200"
                    >
                        JETZT AKTIVIEREN
                    </Button>
                </div>
            ) : (
                <>
                    {/* Zone A: Dashboard */}
                    <section>
                        <RecoveryDashboard stats={stats} funnel={funnel} />
                    </section>

                    <Tabs defaultValue="rechnung" className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <TabsList className="bg-transparent p-0 h-auto space-x-8">
                                <TabsTrigger
                                    value="rechnung"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 rounded-none px-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all bg-transparent"
                                >
                                    <Layout className="w-3.5 h-3.5 mr-2" /> Kauf auf Rechnung
                                </TabsTrigger>
                                <TabsTrigger
                                    value="vorkasse"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 rounded-none px-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all bg-transparent"
                                >
                                    <Settings2 className="w-3.5 h-3.5 mr-2" /> Vorkasse Strategy
                                </TabsTrigger>
                            </TabsList>

                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50" onClick={loadStats}>
                                <RefreshCcw className="w-3 h-3 mr-2" /> Daten aktualisieren
                            </Button>
                        </div>

                        <TabsContent value="rechnung" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Zone B: Timeline */}
                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Recovery Journey</h2>
                                        <p className="text-sm font-medium text-slate-500">Visualisieren und optimieren Sie Ihren Mahn-Workflows.</p>
                                    </div>
                                </div>
                                <TimelineBuilder settings={rechnung} onUpdate={setRechnung} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3">
                                    <TemplateManager settings={rechnung} onUpdate={setRechnung} type="rechnung" />
                                </div>
                                <div className="lg:col-span-1">
                                    <RulesPerformance settings={rechnung} onUpdate={setRechnung} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="vorkasse" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-4">
                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Vorkasse Automatisierung</h2>
                                <TimelineBuilder settings={vorkasse} onUpdate={setVorkasse} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3">
                                    <TemplateManager settings={vorkasse} onUpdate={setVorkasse} type="vorkasse" />
                                </div>
                                <div className="lg:col-span-1">
                                    <RulesPerformance settings={vorkasse} onUpdate={setVorkasse} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </>
            )}
            
        </div>
    )
}
