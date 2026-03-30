'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users } from "lucide-react"

export function CustomerAnalytics() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Kundenwachstum & Umsatz
                    </CardTitle>
                    <Tabs defaultValue="30" className="h-8">
                        <TabsList className="bg-slate-100 p-0.5 h-8">
                            <TabsTrigger value="7" className="text-[10px] font-black h-7 px-3">7T</TabsTrigger>
                            <TabsTrigger value="30" className="text-[10px] font-black h-7 px-3">30T</TabsTrigger>
                            <TabsTrigger value="90" className="text-[10px] font-black h-7 px-3">90T</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-64 mt-4 flex items-end gap-2 px-4 relative">
                        {/* Area Chart Mockup */}
                        <svg className="absolute inset-0 px-10 py-10 w-full h-full opacity-10" preserveAspectRatio="none">
                            <path d="M0,50 Q100,20 200,60 T400,10 T600,40 T800,20 L800,100 L0,100 Z" fill="currentColor" className="text-blue-600" />
                        </svg>
                        {[30, 45, 25, 60, 40, 75, 55, 90, 65, 85, 45, 70].map((h, i) => (
                            <div key={i} className="flex-1 space-y-1 group relative">
                                <div className="bg-slate-100 hover:bg-slate-900 rounded-t-sm transition-all duration-500 relative" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                        + {Math.floor(h / 2)} Kunden
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 px-4">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'].map(m => (
                            <span key={m} className="text-[10px] font-black text-slate-300 uppercase">{m}</span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-900 bg-slate-900 text-white shadow-xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> LTV Verteilung
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        {[
                            { label: '0 - 100€', percent: 45, color: 'bg-slate-700' },
                            { label: '100€ - 500€', percent: 32, color: 'bg-indigo-500' },
                            { label: '500€ - 1k€', percent: 18, color: 'bg-violet-500' },
                            { label: '1k€+', percent: 5, color: 'bg-emerald-500' }
                        ].map((segment, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                    <span>{segment.label}</span>
                                    <span>{segment.percent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${segment.color} rounded-full transition-all duration-1000`} style={{ width: `${segment.percent}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Top Insights</p>
                        <p className="text-xs font-bold text-center">80% Ihres Umsatzes kommen von Top 20% der Kunden.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
