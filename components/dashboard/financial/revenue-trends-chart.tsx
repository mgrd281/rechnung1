'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/components/ui/button'

interface RevenueChartProps {
    data: any[]
    loading?: boolean
    period: string
    onPeriodChange: (p: string) => void
}

export function RevenueTrendsChart({ data, loading, period, onPeriodChange }: RevenueChartProps) {
    if (loading) return <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse"></div>

    return (
        <Card className="col-span-1 lg:col-span-8 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                    <CardTitle className="text-lg font-bold text-gray-900">Umsatzentwicklung</CardTitle>
                    <CardDescription>Visualisierung der Rechnungsströme über die Zeit</CardDescription>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['7d', '30d', '90d'].map((p) => (
                        <button
                            key={p}
                            onClick={() => onPeriodChange(p)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                tickFormatter={(value) => `€${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, '']}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('de-DE', { dateStyle: 'full' })}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Gesamtumsatz"
                                stroke="#818cf8"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                strokeWidth={3}
                            />
                            <Area
                                type="monotone"
                                dataKey="paid"
                                name="Bezahlt"
                                stroke="#34d399"
                                fillOpacity={1}
                                fill="url(#colorPaid)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
