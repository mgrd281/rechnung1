'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, Edit, MoreHorizontal, Mail, Sparkles } from "lucide-react"

interface CampaignManagerProps {
    settings: any
    onUpdate: (settings: any) => void
    type: 'fpd' | 'abandoned-cart'
}

export function CampaignManager({ settings, onUpdate, type }: CampaignManagerProps) {

    // Helper to update specific field
    const updateField = (field: string, value: any) => {
        onUpdate({ ...settings, [field]: value })
    }

    const isFPD = type === 'fpd'
    const subjectField = isFPD ? 'fpdEmailSubject' : 'emailSubject' // Mapping assumption (need to check AbandonedCartSettings schema later, assuming standard fields)
    const bodyField = isFPD ? 'fpdEmailBody' : 'emailBody'

    return (
        <Card className="border-slate-200">
            <CardHeader>
                <CardTitle>Kampagnen & Inhalte</CardTitle>
                <CardDescription>Verwalten Sie Ihre aktiven Automationen und E-Mail Vorlagen.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="automation">
                    <TabsList className="mb-6">
                        <TabsTrigger value="automation">Automationen</TabsTrigger>
                        <TabsTrigger value="templates">E-Mail Vorlagen</TabsTrigger>
                        <TabsTrigger value="campaigns" disabled>Newsletter (Bald verfügbar)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="automation" className="space-y-4">
                        {/* Automation List Item */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-violet-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.fpdEnabled ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                    {isFPD ? <Sparkles className={`w-5 h-5 ${settings.fpdEnabled ? 'text-emerald-600' : 'text-slate-400'}`} /> : <Mail className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">{isFPD ? 'Erstkauf-Rabatt Flow' : 'Warenkorb-Abbruch Flow'}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Badge variant={settings[isFPD ? 'fpdEnabled' : 'enabled'] ? 'default' : 'secondary'} className={settings[isFPD ? 'fpdEnabled' : 'enabled'] ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                            {settings[isFPD ? 'fpdEnabled' : 'enabled'] ? 'Aktiv' : 'Pausiert'}
                                        </Badge>
                                        <span>•</span>
                                        <span>Zuletzt bearbeitet: Heute</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon">
                                    <Edit className="w-4 h-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="templates" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Betreffzeile</Label>
                                    <Input
                                        value={settings[subjectField] || ''}
                                        onChange={(e) => updateField(subjectField, e.target.value)}
                                        placeholder="Ihr persönlicher Gutscheincode"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nachricht</Label>
                                    <Textarea
                                        value={settings[bodyField] || ''}
                                        onChange={(e) => updateField(bodyField, e.target.value)}
                                        className="h-[300px] font-mono text-sm"
                                        placeholder="Hallo {{customer_name}}, ..."
                                    />
                                    <p className="text-xs text-slate-500">
                                        Verfügbare Variablen: {'{{customer_name}}'}, {'{{discount_code}}'}, {'{{shop_name}}'}
                                    </p>
                                </div>
                            </div>

                            {/* Live Preview Mockup */}
                            <div className="bg-slate-100 p-8 rounded-xl flex items-center justify-center">
                                <div className="w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
                                    <div className="bg-slate-50 px-4 py-3 border-b flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-4 w-1/3 bg-slate-100 rounded"></div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-slate-50 rounded"></div>
                                            <div className="h-2 w-5/6 bg-slate-50 rounded"></div>
                                            <div className="h-2 w-4/6 bg-slate-50 rounded"></div>
                                        </div>
                                        <div className="py-4 flex justify-center">
                                            <div className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium">
                                                Code: SUMMER2024
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
