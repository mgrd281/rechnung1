'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, PieChart } from "lucide-react"

export function SegmentsPerformance() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Kundensegmente
                    </CardTitle>
                    <CardDescription>Verteilung Ihrer Kundenbasis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <SegmentItem label="Neukunden (Risiko)" percent={15} count={124} color="bg-amber-500" />
                        <SegmentItem label="Aktive Käufer" percent={45} count={890} color="bg-emerald-500" />
                        <SegmentItem label="VIP / Loyal" percent={10} count={85} color="bg-violet-500" />
                        <SegmentItem label="Inaktiv (>180 Tage)" percent={30} count={420} color="bg-slate-400" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Top Performer
                    </CardTitle>
                    <CardDescription>Effektivste Kanäle und Zeiten.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-teal-800">Bestes Segment</span>
                                <Badge className="bg-teal-200 text-teal-800 hover:bg-teal-300">Neukunden</Badge>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-teal-900">24.8%</span>
                                <span className="text-xs text-teal-600 mb-1">Conversion Rate</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Öffnungsrate (E-Mail)</span>
                                <span className="font-semibold text-slate-900">42%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-slate-900 h-1.5 rounded-full w-[42%]"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Klickrate (CTR)</span>
                                <span className="font-semibold text-slate-900">12%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-slate-900 h-1.5 rounded-full w-[12%]"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SegmentItem({ label, percent, count, color }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-slate-700 font-medium">{label}</span>
                <span className="text-slate-500">{count} Kunden</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 flex items-center">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    )
}
