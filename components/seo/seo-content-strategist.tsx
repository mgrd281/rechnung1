'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    PenTool, Sparkles, Loader2, CheckCircle2,
    Image as ImageIcon, Search, Layout,
    Globe, ArrowRight, Save, FileText, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContentPhase, ArticleResult } from '@/lib/ai-content-strategist'

export function SeoContentStrategist() {
    const [topic, setTopic] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentPhase, setCurrentPhase] = useState<ContentPhase | null>(null)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<ArticleResult | null>(null)

    const handleGenerate = async () => {
        if (!topic) return

        setIsGenerating(true)
        setResult(null)
        setProgress(0)

        try {
            const response = await fetch('/api/seo/articles/generate', {
                method: 'POST',
                body: JSON.stringify({ topic })
            })

            const data = await response.json()
            if (data.success) {
                setResult(data.article)
            }
        } catch (error) {
            console.error('Generation failed', error)
        } finally {
            setIsGenerating(false)
            setCurrentPhase(null)
        }
    }

    const phases: { id: ContentPhase, label: string, icon: any }[] = [
        { id: 'Research', label: 'Market Research', icon: Search },
        { id: 'Architecture', label: 'Article Structure', icon: Layout },
        { id: 'Writing', label: 'AI Writing (>1200 words)', icon: PenTool },
        { id: 'Visuals', label: 'Image Prompting', icon: ImageIcon },
        { id: 'SEO', label: 'SEO Optimization', icon: Globe },
        { id: 'QC', label: 'Quality Control', icon: CheckCircle2 },
        { id: 'Format', label: 'HTML Formatting', icon: FileText },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* Input Section */}
            <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-12 space-y-8">
                    <div className="space-y-2">
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest mb-2 px-3 h-6">Enterprise Content Hub</Badge>
                        <h2 className="text-4xl font-black uppercase tracking-tight italic">Magazin & Content Strategist</h2>
                        <p className="text-slate-400 font-medium text-lg">Verwandeln Sie ein einfaches Keyword in einen 1200+ Wörter Fachartikel auf Ahrefs-Niveau.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
                            <Input
                                className="h-16 pl-14 bg-white/10 border-white/10 text-white rounded-2xl text-lg font-bold placeholder:text-white/20 focus:ring-emerald-500/50 transition-all"
                                placeholder="Thema oder Keyword eingeben (z.B. KI-Trends im E-Commerce 2026)"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={isGenerating}
                            />
                        </div>
                        <Button
                            className="h-16 px-10 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 disabled:opacity-50 transition-all"
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic}
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> GENERIERUNG LÄUFT...</>
                            ) : (
                                <><Zap className="w-5 h-5 mr-3" /> ARTIKEL ERSTELLEN</>
                            )}
                        </Button>
                    </div>

                    {isGenerating && (
                        <div className="pt-4 space-y-6">
                            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {phases.map((phase, i) => (
                                    <div key={phase.id} className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                                        currentPhase === phase.id ? "bg-emerald-500/10 scale-105" : "opacity-40"
                                    )}>
                                        <phase.icon className={cn("w-5 h-5", currentPhase === phase.id ? "text-emerald-400" : "text-white")} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">{phase.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Result Section */}
            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Preview Card */}
                        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Artikel Vorschau (HTML)</p>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight">{result.title}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase h-10 border-slate-100 italic">
                                        <Save className="w-4 h-4 mr-2" /> DRAFT
                                    </Button>
                                    <Button className="rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase h-10 italic">
                                        PUBLIZIEREN <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 prose prose-slate max-w-none prose-headings:uppercase prose-headings:font-black prose-headings:italic prose-p:text-slate-600 prose-p:leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: result.htmlContent }} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* SEO Analytics */}
                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden p-8 space-y-6">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">SEO Performance</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shadow-inner">
                                    <span className="text-2xl font-black leading-none">{result.seoScore}</span>
                                    <span className="text-[8px] font-black uppercase">Score</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">{result.wordCount} Wörter</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Standard erfüllt</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Description</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-600 leading-relaxed italic">
                                        "{result.metaDescription}"
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Visual Assets */}
                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden p-8 space-y-6">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Medien & Assets (AI)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                                        <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Hero Image Prompt
                                    </p>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-500 italic">
                                        {result.imagePrompts.hero}
                                    </div>
                                    <Button variant="outline" className="w-full text-[9px] font-black uppercase h-8 border-slate-100 rounded-lg">
                                        BILD GENERIEREN (DALL-E)
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
