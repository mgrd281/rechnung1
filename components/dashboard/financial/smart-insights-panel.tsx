'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SmartInsightsProps {
    insights: Array<{ type: string, text: string }>
}

export function SmartInsightsPanel({ insights }: SmartInsightsProps) {
    if (insights.length === 0) return null

    return (
        <Card className="col-span-1 lg:col-span-12 border-none bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-yellow-300" />
                </div>
                <CardTitle className="text-lg">Smart Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {insights.map((insight, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/20 text-white/90`}>
                                {insight.type === 'opportunity' ? 'Chance' : insight.type === 'warning' ? 'Handlung nötig' : 'Info'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            {insight.text}
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
