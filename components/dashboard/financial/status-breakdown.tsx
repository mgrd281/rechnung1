'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface StatusBreakdownProps {
    statusCounts: Record<string, number>
}

export function StatusBreakdown({ statusCounts }: StatusBreakdownProps) {
    const data = [
        { name: 'Bezahlt', value: statusCounts['PAID'] || 0, color: '#10b981' }, // Emerald-500
        { name: 'Offen', value: (statusCounts['OPEN'] || 0) + (statusCounts['SENT'] || 0), color: '#3b82f6' }, // Blue-500
        { name: 'Überfällig', value: statusCounts['OVERDUE'] || 0, color: '#ef4444' }, // Red-500
        { name: 'Storniert', value: statusCounts['CANCELLED'] || 0, color: '#9ca3af' }, // Gray-400
    ].filter(d => d.value > 0)

    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <Card className="col-span-1 lg:col-span-4 border-none shadow-sm flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Rechnungsstatus</CardTitle>
                <CardDescription>Verteilung nach Status</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="h-[200px] w-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-gray-900">{total}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Gesamt</span>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                <span className="text-xs text-gray-400 w-8 text-right">
                                    {Math.round((item.value / total) * 100)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
