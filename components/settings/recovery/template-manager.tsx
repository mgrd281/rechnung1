'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Smartphone, Monitor, Send, Sparkles, Hash } from "lucide-react"

export function TemplateManager({ settings, onUpdate, type }: any) {
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

    const templates = [
        { id: 'reminder1', label: 'Erinnerung' },
        { id: 'reminder2', label: 'Mahnung 1' },
        { id: 'reminder3', label: 'Mahnung 2' },
        { id: 'cancellation', label: 'Letzte Mahnung' }
    ]

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Communication Templates</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 font-bold border-slate-200">
                            <Send className="w-3.5 h-3.5 mr-2" /> Test-Mail
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="reminder1" className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[500px]">
                    {/* Sidebar Nav */}
                    <div className="w-full lg:w-48 bg-slate-50/30">
                        <TabsList className="flex flex-col h-full bg-transparent p-2 gap-1 rounded-none justify-start">
                            {templates.map(tmp => (
                                <TabsTrigger
                                    key={tmp.id}
                                    value={tmp.id}
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 justify-start h-10 px-4 font-bold text-xs uppercase tracking-tight"
                                >
                                    {tmp.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Editor & Preview */}
                    <div className="flex-1 grid grid-cols-1 xl:grid-cols-2">
                        {templates.map(tmp => (
                            <TabsContent key={tmp.id} value={tmp.id} className="m-0 p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Betreffzeile</Label>
                                        <Input className="border-slate-200 font-bold" placeholder="Zahlungserinnerung für Ihre Bestellung" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-Mail Text</Label>
                                            <div className="flex gap-1.5">
                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-black text-indigo-600 hover:bg-slate-50">
                                                    <Sparkles className="w-3 h-3 mr-1" /> AI WRITER
                                                </Button>
                                            </div>
                                        </div>
                                        <Textarea
                                            className="min-h-[200px] border-slate-200 leading-relaxed text-sm resize-none focus-visible:ring-indigo-500"
                                            placeholder="Guten Tag {{customer_name}}, ..."
                                        />

                                        {/* Variables */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {['customer_name', 'invoice_number', 'amount', 'due_date'].map(val => (
                                                <Button key={val} variant="outline" size="sm" className="h-7 text-[10px] font-black bg-slate-50 border-slate-200 uppercase tracking-tight">
                                                    <Hash className="w-3 h-3 mr-1 text-slate-400" /> {val}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}

                        {/* Preview Zone */}
                        <div className="bg-slate-50/50 p-6 flex flex-col border-t xl:border-t-0 xl:border-l border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Preview</span>
                                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                                    <Button
                                        onClick={() => setPreviewMode('desktop')}
                                        variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                                        size="icon"
                                        className="h-7 w-7"
                                    >
                                        <Monitor className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        onClick={() => setPreviewMode('mobile')}
                                        variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                                        size="icon"
                                        className="h-7 w-7"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className={`
                                bg-white border border-slate-200 shadow-xl rounded-2xl mx-auto overflow-hidden transition-all duration-500
                                ${previewMode === 'mobile' ? 'w-[280px] h-[480px]' : 'w-full h-full'}
                             `}>
                                <div className="bg-slate-900 px-4 py-2 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="flex-1 bg-slate-800 rounded px-3 py-1 text-[9px] text-slate-400 font-mono truncate">
                                        https://mail.google.com/inbox/reminder...
                                    </div>
                                </div>
                                <div className="p-8 space-y-4">
                                    <div className="w-32 h-8 bg-slate-100 rounded mb-8" />
                                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                                    <div className="space-y-2 pt-4">
                                        <div className="h-3 bg-slate-50 rounded" />
                                        <div className="h-3 bg-slate-50 rounded" />
                                        <div className="h-3 bg-slate-50 rounded w-4/5" />
                                    </div>
                                    <div className="pt-8">
                                        <div className="h-10 bg-indigo-600 rounded-lg w-full shadow-lg shadow-indigo-100" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
