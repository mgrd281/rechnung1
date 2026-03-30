'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Zap, Clock, Mail, Gift, ChevronDown, Check, MousePointerClick } from "lucide-react"

interface JourneyBuilderProps {
    settings: any
    onUpdate: (settings: any) => void
    type: 'fpd' | 'abandoned-cart'
}

export function JourneyBuilder({ settings, onUpdate, type }: JourneyBuilderProps) {
    const [selectedNode, setSelectedNode] = useState<string | null>(null)

    const updateField = (field: string, value: any) => {
        onUpdate({ ...settings, [field]: value })
    }

    const isFPD = type === 'fpd'

    return (
        <div className="h-[600px] bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex flex-col items-center py-12">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Start Node */}
            <div className="z-10 mb-8">
                <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    {isFPD ? 'Trigger: Kauf erfolgreich (Paid)' : 'Trigger: Checkout abgebrochen'}
                </div>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-8 bg-slate-300 z-0"></div>

            {/* Delay Node */}
            <div className="z-10 mb-8 group relative" onClick={() => setSelectedNode('delay')}>
                <div className={`bg-white border-2 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3 w-64 hover:border-violet-500 cursor-pointer transition-colors ${selectedNode === 'delay' ? 'border-violet-500 ring-4 ring-violet-500/10' : 'border-slate-200'}`}>
                    <div className="bg-amber-100 p-2 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Wartezeit</div>
                        <div className="font-semibold text-slate-900">
                            {isFPD ? 'Sofort' : '1 Stunde'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-8 bg-slate-300 z-0"></div>

            {/* Action Node */}
            <div className="z-10 mb-8 group relative" onClick={() => setSelectedNode('action')}>
                <div className={`bg-white border-2 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3 w-64 hover:border-violet-500 cursor-pointer transition-colors ${selectedNode === 'action' ? 'border-violet-500 ring-4 ring-violet-500/10' : 'border-slate-200'}`}>
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Aktion</div>
                        <div className="font-semibold text-slate-900">
                            {isFPD ? 'Sende Rabattcode' : 'Sende Warenkorb-Mail'}
                        </div>
                    </div>
                </div>
            </div>

            {/* End Node */}
            <div className="w-0.5 h-8 bg-slate-300 z-0"></div>
            <div className="z-10">
                <div className="bg-slate-200 text-slate-500 px-4 py-1.5 rounded-full text-xs font-medium">
                    Ende
                </div>
            </div>


            {/* Edit Panel */}
            <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Schritt bearbeiten</SheetTitle>
                        <SheetDescription>Passen Sie die Einstellungen dieses Schrittes an.</SheetDescription>
                    </SheetHeader>

                    {selectedNode === 'action' && isFPD && (
                        <div className="space-y-6 py-6">
                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-900 text-sm">Automatischer Rabatt</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Ein Code wird generiert und in die E-Mail eingefügt.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Rabattwert (%)</Label>
                                <Input
                                    type="number"
                                    value={settings.fpdPercentage}
                                    onChange={(e) => updateField('fpdPercentage', parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Gültigkeit (Tage)</Label>
                                <Input
                                    type="number"
                                    value={settings.fpdValidityDays}
                                    onChange={(e) => updateField('fpdValidityDays', parseFloat(e.target.value))}
                                />
                            </div>

                            <Separator />

                            <Button className="w-full" onClick={() => setSelectedNode(null)}>
                                <Check className="w-4 h-4 mr-2" />
                                Übernehmen
                            </Button>
                        </div>
                    )}

                    {selectedNode === 'delay' && (
                        <div className="space-y-6 py-6">
                            <div className="space-y-2">
                                <Label>Wartezeit</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        defaultValue={isFPD ? 0 : 60}
                                        disabled={isFPD} // FPD is instant based on current logic
                                    />
                                    <span className="text-sm font-medium text-slate-500">Minuten</span>
                                </div>
                                {isFPD && <p className="text-xs text-slate-500">Der Erstkauf-Rabatt wird aktuell immer sofort versendet.</p>}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
