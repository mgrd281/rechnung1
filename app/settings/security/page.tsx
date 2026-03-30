'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Shield, Lock, Users, Save, Loader2, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function SecuritySettingsPage() {
    const [settings, setSettings] = useState({
        twoFactorAuth: false,
        sessionTimeout: 60
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) {
                const data = await res.json()
                setSettings({
                    twoFactorAuth: data.twoFactorAuth || false,
                    sessionTimeout: data.sessionTimeout || 60
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            if (res.ok) {
                showToast('Einstellungen gespeichert', 'success')
            } else {
                throw new Error('Failed')
            }
        } catch (error) {
            showToast('Fehler beim Speichern', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return null

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sicherheit</h2>
                    <p className="text-slate-500">Schützen Sie Ihren Account und verwalten Sie Zugriffe.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Speichern
                </Button>
            </div>

            <Separator />

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-violet-600" /> Authentifizierung
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="font-medium text-slate-900">Zwei-Faktor-Authentifizierung (2FA)</div>
                            <div className="text-sm text-slate-500">Erhöht die Sicherheit durch einen zweiten Code beim Login.</div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/settings/two-factor">Konfigurieren</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-violet-600" /> Sitzungssicherheit
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Automatischer Logout (Minuten)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                className="w-32"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                            />
                            <p className="text-sm text-slate-500">Minuten Inaktivität bis zur Abmeldung.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-violet-600" /> Zugriffskontrolle
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="font-medium text-slate-900">Blockierte Benutzer</div>
                            <div className="text-sm text-slate-500">Liste aller gesperrten E-Mail-Adressen und Kunden.</div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/blocked-users">Verwalten</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
