'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Crown, Zap, AlertTriangle, Ghost } from "lucide-react"

export function CustomerSegments({ segments, activeSegment, onSegmentChange }: any) {
    const getIcon = (id: string) => {
        switch (id) {
            case 'vip': return Crown
            case 'new': return Zap
            case 'inactive': return Ghost
            case 'at_risk': return AlertTriangle
            default: return Users
        }
    }

    const getColor = (id: string) => {
        switch (id) {
            case 'vip': return 'text-violet-600 bg-violet-50'
            case 'new': return 'text-amber-600 bg-amber-50'
            case 'inactive': return 'text-slate-400 bg-slate-50'
            case 'at_risk': return 'text-red-600 bg-red-50'
            default: return 'text-blue-600 bg-blue-50'
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Intelligente Segmente</h3>
                <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase">
                    <Plus className="w-3 h-3" /> NEUES SEGMENT ERSTELLEN
                </button>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {segments?.map((seg: any) => {
                    const Icon = getIcon(seg.id)
                    const colorClasses = getColor(seg.id)
                    const isActive = activeSegment === seg.id

                    return (
                        <Card
                            key={seg.id}
                            onClick={() => onSegmentChange(seg.id)}
                            className={`
                                min-w-[180px] cursor-pointer transition-all border-2 
                                ${isActive ? 'border-blue-600 shadow-lg shadow-blue-50 translate-y-[-2px]' : 'border-slate-50 hover:border-slate-200 shadow-sm'}
                            `}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-1.5 rounded-lg ${colorClasses}`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <Badge variant="secondary" className="text-[9px] font-black">
                                        {seg.count}
                                    </Badge>
                                </div>
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{seg.label}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    €{seg.revenue?.toLocaleString('de-DE')} Umsatz
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
