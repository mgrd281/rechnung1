'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Zap, Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export function AutomationSettings() {
    const [settings, setSettings] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        fetch('/api/security/automation')
            .then(res => res.json())
            .then(data => {
                setSettings(data.settings || {})
                setLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/security/automation', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                showToast("Automatisierung gespeichert", "success")
            }
        } catch (e) {
            showToast("Fehler beim Speichern", "error")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></div>

    return (
        <Card className="border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" /> Automatischer Schutz
                </CardTitle>
                <CardDescription>
                    Konfigurieren Sie Regeln, um Angriffe automatisch zu erkennen und zu blockieren.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label className="text-base">Brute-Force Schutz</Label>
                        <p className="text-sm text-slate-500">Blockiert IP-Adressen nach mehreren fehlgeschlagenen Login-Versuchen.</p>
                    </div>
                    <Switch
                        checked={settings.blockFailedAttempts}
                        onCheckedChange={(c) => setSettings({ ...settings, blockFailedAttempts: c })}
                    />
                </div>

                {settings.blockFailedAttempts && (
                    <div className="pl-6 border-l-2 border-slate-100 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                            <Label className="w-40">Max. Versuche</Label>
                            <Input
                                type="number"
                                className="w-24"
                                value={settings.maxFailedAttempts}
                                onChange={(e) => setSettings({ ...settings, maxFailedAttempts: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label className="text-base">Suspicious Domain Blocking</Label>
                        <p className="text-sm text-slate-500">Blockiert automatisch temporäre E-Mail Adressen und bekannte Spam-Domains.</p>
                    </div>
                    <Switch
                        checked={settings.blockSuspiciousDomains}
                        onCheckedChange={(c) => setSettings({ ...settings, blockSuspiciousDomains: c })}
                    />
                </div>

                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label className="text-base">Auto-Unblock</Label>
                        <p className="text-sm text-slate-500">Hebt temporäre Sperren automatisch nach einer bestimmten Zeit auf.</p>
                    </div>
                    <Switch
                        checked={settings.autoUnblock}
                        onCheckedChange={(c) => setSettings({ ...settings, autoUnblock: c })}
                    />
                </div>

                {settings.autoUnblock && (
                    <div className="pl-6 border-l-2 border-slate-100 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                            <Label className="w-40">Dauer (Stunden)</Label>
                            <Input
                                type="number"
                                className="w-24"
                                value={settings.autoUnblockDuration}
                                onChange={(e) => setSettings({ ...settings, autoUnblockDuration: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Einstellungen speichern
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
