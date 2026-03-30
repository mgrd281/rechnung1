'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Euro, Activity, CreditCard, AlertCircle } from 'lucide-react'

interface KpiGridProps {
    data: {
        totalRevenue: number
        paidAmount: number
        openAmount: number
        overdueAmount: number
        avgValue: number
    }
    loading?: boolean
}

export function FinancialKpiGrid({ data, loading }: KpiGridProps) {
    if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>)}
    </div>

    const kpis = [
        {
            label: 'Gesamtumsatz',
            value: data.totalRevenue,
            icon: Euro,
            change: '+12.5%',
            trend: 'up',
            color: 'text-gray-900',
            bg: 'bg-gray-100'
        },
        {
            label: 'Bezahlt',
            value: data.paidAmount,
            icon: CreditCard,
            change: '+8.2%',
            trend: 'up',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Offen',
            value: data.openAmount,
            icon: Activity,
            change: '-2.1%',
            trend: 'down', // Good thing
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Überfällig',
            value: data.overdueAmount,
            icon: AlertCircle,
            change: '+4.3%',
            trend: 'up', // Bad thing
            color: 'text-red-600',
            bg: 'bg-red-50'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl ${kpi.bg} group-hover:scale-110 transition-transform duration-200`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {kpi.change}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {kpi.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
