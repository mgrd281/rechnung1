'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, RefreshCcw, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

import { GrowthDashboard } from '@/components/settings/marketing/growth-dashboard'
import { JourneyBuilder } from '@/components/settings/marketing/journey-builder'
import { CampaignManager } from '@/components/settings/marketing/campaign-manager'
import { SegmentsPerformance } from '@/components/settings/marketing/segments-performance'
import { PageHeader } from '@/components/layout/page-header'

export default function MarketingSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    const [settings, setSettings] = useState<any>({})
    const [stats, setStats] = useState<any>({ newCustomers: 0, automationRevenue: 0, conversionRate: 0, activeAutomations: 0 })
    const [funnel, setFunnel] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [settingsRes, statsRes] = await Promise.all([
                fetch('/api/settings/marketing'),
                fetch('/api/settings/marketing/stats')
            ])
            if (settingsRes.ok) setSettings(await settingsRes.json())
            if (statsRes.ok) {
                const data = await statsRes.json()
                if (data.stats) setStats(data.stats)
                if (data.funnel) setFunnel(data.funnel)
            }
        } catch (error) {
            console.error(error)
            showToast('Fehler beim Laden der Daten', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings/marketing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) showToast('Marketing-Einstellungen gespeichert', 'success')
            else throw new Error('Failed')
        } catch (error) {
            showToast('Fehler beim Speichern', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    // Header Actions
    const headerActions = (
        <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${settings.fpdEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <div className={`w-2 h-2 rounded-full ${settings.fpdEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {settings.fpdEnabled ? 'Automation Active' : 'Paused'}
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Speichert...' : 'Veröffentlichen'}
            </Button>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                {/* 1. Page Header (Replaces Custom Header) */}
                <PageHeader
                    title="Growth Automation Hub"
                    subtitle="Enterprise Marketing & Journeys"
                    actions={headerActions}
                />

                <div className="space-y-8">
                    {/* 2. KPI Zone */}
                    <section>
                        <GrowthDashboard stats={stats} funnel={funnel} />
                    </section>

                    <Tabs defaultValue="journey" className="space-y-6">
                        {/* 3. Tab Bar Normalized */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                            <TabsList className="bg-transparent p-0 h-auto space-x-6">
                                <TabsTrigger
                                    value="journey"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 rounded-none px-1 py-3 text-slate-500 hover:text-slate-700 font-medium bg-transparent"
                                >
                                    Customer Journeys
                                </TabsTrigger>
                                <TabsTrigger
                                    value="campaigns"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 rounded-none px-1 py-3 text-slate-500 hover:text-slate-700 font-medium bg-transparent"
                                >
                                    Kampagnen & Vorlagen
                                </TabsTrigger>
                                <TabsTrigger
                                    value="segments"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 rounded-none px-1 py-3 text-slate-500 hover:text-slate-700 font-medium bg-transparent"
                                >
                                    Segmente
                                </TabsTrigger>
                            </TabsList>

                            <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-100" onClick={loadData}>
                                <RefreshCcw className="w-3 h-3 mr-2" />
                                Daten aktualisieren
                            </Button>
                        </div>

                        <TabsContent value="journey" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3">
                                    <div className="mb-6">
                                        <h2 className="text-lg font-bold text-slate-900">Journey Builder</h2>
                                        <p className="text-sm text-slate-500">Visualisieren und bearbeiten Sie Ihre Automatisierungs-Flows.</p>
                                    </div>
                                    <JourneyBuilder settings={settings} onUpdate={setSettings} type="fpd" />
                                </div>
                                <div className="space-y-4 pt-4">
                                    <h3 className="font-semibold text-slate-900 mt-14">Aktiver Flow</h3>
                                    <div className="p-3 bg-white border border-violet-200 rounded-lg shadow-sm cursor-pointer ring-2 ring-violet-500">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-100 p-2 rounded-lg">
                                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">Erstkauf-Rabatt</div>
                                                <div className="text-xs text-slate-500">Trigger: Checkout (Paid)</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2 rounded-lg">
                                                <Sparkles className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">Warenkorb Abbruch</div>
                                                <div className="text-xs text-slate-500">Trigger: Cart Abandoned</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="campaigns" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CampaignManager settings={settings} onUpdate={setSettings} type="fpd" />
                        </TabsContent>

                        <TabsContent value="segments" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SegmentsPerformance />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            
        </div>
    )
}
