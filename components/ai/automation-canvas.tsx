'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Play, Search, Sparkles, Activity, Layout,
    ChevronRight, ArrowRight, Settings2, Info,
    Calendar, Globe, ShieldCheck, Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function AutomationCanvas() {
    const [selectedNode, setSelectedNode] = useState<string | null>('gen')

    const nodes = [
        {
            id: 'trig',
            type: 'Trigger',
            label: 'Zeitplan',
            detail: 'Täglich @ 09:00',
            icon: Calendar,
            color: 'bg-blue-500',
            params: ['Region: DE', 'Stunde: 09:00', 'Tage: Werktage']
        },
        {
            id: 'res',
            type: 'Research',
            label: 'Themen-Analyse',
            detail: 'Shopify & SaaS Trends',
            icon: Search,
            color: 'bg-emerald-500',
            params: ['Konkurrenz: Aktiv', 'Keyword-Limit: 50', 'Aktualität: 24h']
        },
        {
            id: 'gen',
            type: 'Write',
            label: 'Article Generator',
            detail: '900+ Wörter, Expert',
            icon: Sparkles,
            color: 'bg-violet-500',
            params: ['Ton: Professionell', 'Links: Intern', 'Sektion: FAQ']
        },
        {
            id: 'seo',
            type: 'Optimize',
            label: 'SEO & Quality Gate',
            detail: 'Score > 80, Uni: 95%',
            icon: ShieldCheck,
            color: 'bg-amber-500',
            params: ['SEO-Ziel: Hoch', 'Min. Länge: 900', 'Eindeutigkeit: Check']
        },
        {
            id: 'pub',
            type: 'Publish',
            label: 'Shopify Store',
            detail: 'Blog: News/SaaS',
            icon: Layout,
            color: 'bg-slate-800',
            params: ['Modus: Auto-Post', 'Autor: KI-Agent', 'Tags: Dynamisch']
        }
    ]

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-12 min-h-[500px] relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-800 shadow-2xl">
                {/* Visual Connector Lines (Behind) */}
                <div className="absolute inset-0 flex items-center justify-center px-20">
                    <div className="w-full h-1 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-slate-500/20" />
                </div>

                <div className="flex items-center gap-8 relative z-10 w-full overflow-x-auto pb-10 scrollbar-hide px-6">
                    {nodes.map((node, i) => (
                        <div key={node.id} className="flex items-center gap-8 flex-shrink-0">
                            <div
                                onClick={() => setSelectedNode(node.id)}
                                className={`
                                    w-56 p-6 rounded-3xl transition-all duration-300 transform cursor-pointer border-2
                                    ${selectedNode === node.id
                                        ? 'bg-white border-violet-500 scale-110 shadow-2xl ring-4 ring-violet-500/10'
                                        : 'bg-white/10 backdrop-blur-xl border-white/5 hover:bg-white/15 hover:scale-105'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${selectedNode === node.id ? 'text-slate-400' : 'text-white/40'}`}>
                                        {node.type}
                                    </p>
                                    <div className={`p-1.5 rounded-lg ${node.color} text-white shadow-lg`}>
                                        <node.icon className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <h4 className={`text-xs font-black uppercase ${selectedNode === node.id ? 'text-slate-900' : 'text-white'}`}>
                                    {node.label}
                                </h4>
                                <p className={`text-[10px] font-bold mt-1 ${selectedNode === node.id ? 'text-slate-500' : 'text-white/60'}`}>
                                    {node.detail}
                                </p>
                            </div>
                            {i < nodes.length - 1 && (
                                <ArrowRight className="w-6 h-6 text-white/10" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Node Details / Params overlay */}
                <div className="mt-8 grid grid-cols-5 gap-4 w-full px-6">
                    {nodes.map(node => (
                        <div key={node.id} className={`transition-opacity duration-300 ${selectedNode === node.id ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="space-y-1.5">
                                {node.params.map((p, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                        <div className={`w-1 h-1 rounded-full ${node.color}`} />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Config Card */}
            {selectedNode && (
                <Card className="border-none shadow-xl bg-white p-8 rounded-[2rem] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className={`p-4 rounded-2xl ${nodes.find(n => n.id === selectedNode)?.color}`}>
                                {(() => {
                                    const Icon = nodes.find(n => n.id === selectedNode)?.icon || Settings2
                                    return <Icon className="w-6 h-6 text-white" />
                                })()}
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                                    {nodes.find(n => n.id === selectedNode)?.label} Konfiguration
                                </h3>
                                <p className="text-slate-500 font-medium text-sm">Präzise Steuerung der KI-Logik für diesen Workflow-Schritt.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-10 px-4 font-black text-[10px] uppercase border-slate-200">Zurücksetzen</Button>
                            <Button className="h-10 px-6 font-black text-[10px] uppercase bg-slate-900 text-white">Änderungen speichern</Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}
