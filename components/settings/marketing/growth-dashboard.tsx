'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Users, Euro, Zap, Percent, Plus, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GrowthDashboardProps {
    stats: {
        newCustomers: number
        automationRevenue: number
        conversionRate: number
        activeAutomations: number
    }
    funnel: Array<{ step: string; count: number; conversion: number }>
}

export function GrowthDashboard({ stats, funnel }: GrowthDashboardProps) {
    const hasFunnelData = funnel.length > 0 && funnel.some(f => f.count > 0);

    return (
        <div className="space-y-8">
            {/* KPI Grid - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Neukunden (30 Tage)"
                    value={stats.newCustomers}
                    icon={Users}
                    trend="good"
                    subtext="Wachstum"
                />
                <KPICard
                    title="Umsatz durch Automation"
                    value={`€${stats.automationRevenue.toFixed(2)}`}
                    icon={Euro}
                    trend="good"
                    subtext="Wiederhergestellt"
                />
                <KPICard
                    title="Conversion Rate"
                    value={`${stats.conversionRate}%`}
                    icon={Percent}
                    subtext="Shop Leistung"
                />
                <KPICard
                    title="Aktive Automationen"
                    value={stats.activeAutomations}
                    icon={Zap}
                    subtext="Workflows"
                />
            </div>

            {/* Automation Funnel */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Automation Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    {!hasFunnelData ? (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-12 text-center h-[320px]">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                <Zap className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Noch keine Automationen</h3>
                            <p className="text-slate-500 mb-6 max-w-sm">Erstellen Sie Ihre erste Customer Journey, um Besucher in treue Kunden zu verwandeln.</p>
                            <div className="flex gap-3">
                                <Button className="bg-slate-900 hover:bg-black text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Journey erstellen
                                </Button>
                                <Button variant="outline">
                                    <LayoutTemplate className="w-4 h-4 mr-2" />
                                    Vorlage auswählen
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative pt-6 pb-2">
                            <div className="flex justify-between items-end gap-2 h-64">
                                {funnel.map((step, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                                        <div className="mb-2 text-center opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                                            {step.count} ({step.conversion}%)
                                        </div>
                                        <div
                                            className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden transition-all duration-500 hover:bg-violet-100"
                                            style={{ height: `${Math.max(15, step.conversion)}%` }}
                                        >
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-violet-600 opacity-20"
                                                style={{ height: '100%' }}
                                            />
                                            <div className="absolute top-2 w-full text-center font-bold text-slate-700 text-sm">
                                                {step.conversion}%
                                            </div>
                                        </div>
                                        <div className="mt-3 text-xs font-medium text-slate-500 text-center uppercase tracking-wide">
                                            {step.step}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, trend, subtext }: any) {
    return (
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm font-medium">{title}</span>
                    <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                    <div className="flex items-center gap-2">
                        {trend && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center ${trend === 'good' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                {trend === 'good' ? '+5%' : '-2%'}
                            </span>
                        )}
                        <span className="text-xs text-slate-500">{subtext}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
