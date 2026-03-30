'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Clock, CreditCard, ChevronRight, XCircle, GripVertical, Settings2, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface TimelineBuilderProps {
    settings: any
    onUpdate: (steps: any) => void
}

export function TimelineBuilder({ settings, onUpdate }: TimelineBuilderProps) {
    const [selectedStep, setSelectedStep] = useState<string | null>(null)

    const steps = [
        { id: 'invoice', type: 'start', label: 'RECHNUNG FÄLLIG', day: 0, icon: Clock, color: 'bg-slate-900 text-white' },
        { id: 'reminder1', type: 'action', label: '1. ERINNERUNG', day: settings.reminder1Days || 7, channel: 'Email', icon: Mail, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 'reminder2', type: 'action', label: 'MAHNUNG 1', day: settings.reminder2Days || 10, channel: 'Email', fee: 5, icon: AlertIcon, color: 'bg-amber-50 text-amber-600 border-amber-100' },
        { id: 'reminder3', type: 'action', label: 'MAHNUNG 2', day: 17, channel: 'Email', fee: 3, icon: AlertIcon, color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { id: 'cancellation', type: 'end', label: 'LETZTE MAHNUNG', day: settings.cancellationDays || 24, channel: 'Shopify Action', fee: 3, icon: XCircle, color: 'bg-red-50 text-red-600 border-red-100' }
    ]

    return (
        <div className="relative py-12 px-2 overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
            <div className="flex items-center min-w-max px-12 relative">
                {/* Horizontal Path */}
                <div className="absolute top-[84px] left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-24" />

                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className="relative flex flex-col items-center">
                            {/* Day Badge */}
                            <div className="mb-6 z-10">
                                <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg shadow-slate-200">
                                    Tag {step.day}
                                </span>
                            </div>

                            {/* Node Card */}
                            <div
                                onClick={() => setSelectedStep(step.id)}
                                className={`
                                    w-56 p-5 rounded-xl border-2 transition-all cursor-pointer z-10
                                    ${selectedStep === step.id ? 'border-indigo-600 shadow-xl shadow-indigo-50 translate-y-[-4px]' : 'border-slate-50 bg-white hover:border-slate-200 hover:translate-y-[-2px] shadow-sm'}
                                `}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${step.color} border`}>
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {step.fee && (
                                            <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] font-black">+{step.fee}%</Badge>
                                        )}
                                        {step.id !== 'invoice' && <GripVertical className="w-3 h-3 text-slate-300" />}
                                    </div>
                                </div>

                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">{step.label}</h4>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-400">{step.channel || 'System'}</span>
                                    {step.id !== 'invoice' && (
                                        <>
                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-indigo-500">Standard Template</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connector Arrow */}
                        {index < steps.length - 1 && (
                            <div className="w-20 flex justify-center z-0">
                                <div className="p-1 px-2 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-[9px] font-black text-slate-500">+{steps[index + 1].day - step.day}d</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Action Button */}
                <div className="flex items-center ml-12">
                    <Button
                        variant="outline"
                        className="rounded-full border-2 border-dashed border-slate-200 w-12 h-12 p-0 hover:bg-slate-50 hover:border-slate-400"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Button>
                    <span className="ml-3 text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Schritt hinzufügen</span>
                </div>
            </div>

            {/* Sidebar Edit (Sheet) handled outside for cleaner look */}
            {selectedStep && (
                <Sheet open={true} onOpenChange={() => setSelectedStep(null)}>
                    <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader className="border-b pb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-900 rounded-lg text-white">
                                    <Settings2 className="w-5 h-5" />
                                </div>
                                <SheetTitle className="text-xl font-black uppercase tracking-tight">Stage Settings</SheetTitle>
                            </div>
                            <SheetDescription className="font-medium text-slate-500">Passen Sie die Logik für diese Mahnstufe an.</SheetDescription>
                        </SheetHeader>

                        <div className="py-8 space-y-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zeitabstand</Label>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    <div className="flex-1">
                                        <Input type="number" className="border-none bg-transparent h-6 text-lg font-black focus-visible:ring-0 p-0" placeholder="7" />
                                        <p className="text-[10px] font-bold text-slate-400">Tage nach dem vorherigen Event</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kanal & Medium</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="default" className="h-12 bg-slate-900 font-bold"><Mail className="w-4 h-4 mr-2" /> E-Mail</Button>
                                    <Button variant="outline" className="h-12 border-slate-200 text-slate-500 font-bold hover:bg-slate-50">Shopify Action</Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zusatzgebühr (%)</Label>
                                <Input type="number" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-black" placeholder="5" />
                            </div>

                            <div className="pt-8 border-t flex gap-3">
                                <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black">ÄNDERUNGEN SPEICHERN</Button>
                                <Button variant="outline" className="h-12 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-black"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    )
}

function AlertIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    )
}
