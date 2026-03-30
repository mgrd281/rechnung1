// ================================================
// PRODUCT INTELLIGENCE DASHBOARD
// ================================================

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    TrendingUp, Package, DollarSign, AlertTriangle,
    Search, Calendar, BarChart3, Zap, Plus, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ManualSearchModal } from './manual-search-modal'
import { ProductCandidatesTable } from './products-table'

export function ProductIntelligenceDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [isManualSearchOpen, setIsManualSearchOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        // Load dashboard stats (simplified)
        setLoading(false)
        setStats({
            newProductsToday: 12,
            newProductsWeek: 45,
            hotTrendsCount: 8,
            avgMarginPercent: 38.5,
            avgProfitEur: 24.80,
            totalPublished: 127
        })
    }

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Neue Produkte"
                    value={stats?.newProductsToday || 0}
                    subtitle={`${stats?.newProductsWeek || 0} diese Woche`}
                    icon={Package}
                    gradient="from-emerald-500 to-teal-600"
                    trend={+15}
                />
                <StatCard
                    title="Hot Trends"
                    value={stats?.hotTrendsCount || 0}
                    subtitle="Produkte mit 80+ Score"
                    icon={TrendingUp}
                    gradient="from-orange-500 to-red-600"
                    badge="🔥"
                />
                <StatCard
                    title="Ø Profit"
                    value={`${stats?.avgProfitEur?.toFixed(2) || '0.00'}€`}
                    subtitle={`${stats?.avgMarginPercent?.toFixed(1) || '0'}% Marge`}
                    icon={DollarSign}
                    gradient="from-indigo-500 to-purple-600"
                    trend={+8}
                />
                <StatCard
                    title="Veröffentlicht"
                    value={stats?.totalPublished || 0}
                    subtitle="auf Shopify"
                    icon={Zap}
                    gradient="from-blue-500 to-cyan-600"
                />
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ActionCard
                    title="Manual Deep Search"
                    description="Marke oder Kategorie eingeben und tief crawlen"
                    icon={Search}
                    color="indigo"
                    onClick={() => setIsManualSearchOpen(true)}
                />
                <ActionCard
                    title="Auto Discovery"
                    description="Automatische, geplante Product-Scans"
                    icon={Calendar}
                    color="purple"
                    comingSoon
                />
                <ActionCard
                    title="Website Import"
                    description="Von Konkurrent oder Marketplace importieren"
                    icon={BarChart3}
                    color="cyan"
                    comingSoon
                />
            </div>

            {/* Products Table */}
            <Card className="border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Product Candidates</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Entdeckte Produkte zur Review</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200 h-9 text-xs font-bold"
                        >
                            Alle Ansehen <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                <ProductCandidatesTable limit={10} refreshKey={refreshKey} />
            </Card>

            <ManualSearchModal
                isOpen={isManualSearchOpen}
                onClose={() => setIsManualSearchOpen(false)}
                onSuccess={() => {
                    setIsManualSearchOpen(false)
                    setRefreshKey(k => k + 1)
                    loadData()
                }}
            />
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, gradient, trend, badge }: any) {
    return (
        <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br",
                gradient
            )} />

            <div className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br",
                        gradient
                    )}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {badge && <span className="text-2xl">{badge}</span>}
                    {trend && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-xs">
                            +{trend}%
                        </Badge>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{title}</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                    <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                </div>
            </div>
        </Card>
    )
}

function ActionCard({ title, description, icon: Icon, color, onClick, comingSoon }: any) {
    const colors = {
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        cyan: 'from-cyan-500 to-cyan-600'
    }

    return (
        <Card className={cn(
            "relative overflow-hidden border-slate-100 shadow-sm transition-all cursor-pointer group",
            comingSoon ? "opacity-60" : "hover:shadow-lg hover:scale-[1.02]"
        )}
            onClick={!comingSoon ? onClick : undefined}
        >
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
                colors[color as keyof typeof colors]
            )} />

            <div className="p-6 relative">
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg flex-shrink-0",
                        colors[color as keyof typeof colors]
                    )}>
                        <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-black text-slate-900 text-base tracking-tight">{title}</h3>
                            {comingSoon && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] px-2">
                                    Bald
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
                        {!comingSoon && (
                            <div className="mt-3 flex items-center text-indigo-600 text-xs font-bold group-hover:gap-2 transition-all">
                                <span>Starten</span>
                                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
