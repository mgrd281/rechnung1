'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { AlertCircle, Save, CheckCircle, Clock, Percent, Mail, ShoppingBag, CreditCard, FileText, ArrowRight, Sparkles, ArrowLeft, Home } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function DunningPage() {
    const router = useRouter()
    const authenticatedFetch = useAuthenticatedFetch()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Settings State
    const [settings, setSettings] = useState({
        enabled: false,
        reminderDays: 7,
        warning1Days: 3,
        warning2Days: 7,
        finalWarningDays: 7,
        warning1Surcharge: 5.0,
        warning2Surcharge: 3.0,
        finalWarningSurcharge: 3.0
    })

    // Templates State
    const [templates, setTemplates] = useState<Record<string, { subject: string, content: string }>>({
        REMINDER: { subject: '', content: '' },
        WARNING1: { subject: '', content: '' },
        WARNING2: { subject: '', content: '' },
        FINAL: { subject: '', content: '' }
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Settings
            const settingsRes = await authenticatedFetch('/api/dunning/settings')
            const settingsData = await settingsRes.json()
            if (settingsData) {
                setSettings({
                    enabled: settingsData.enabled,
                    reminderDays: settingsData.reminderDays,
                    warning1Days: settingsData.warning1Days,
                    warning2Days: settingsData.warning2Days,
                    finalWarningDays: settingsData.finalWarningDays,
                    warning1Surcharge: Number(settingsData.warning1Surcharge),
                    warning2Surcharge: Number(settingsData.warning2Surcharge),
                    finalWarningSurcharge: Number(settingsData.finalWarningSurcharge)
                })
            }

            // Fetch Templates
            const templatesRes = await authenticatedFetch('/api/dunning/templates')
            const templatesData = await templatesRes.json()
            if (Array.isArray(templatesData)) {
                const newTemplates = { ...templates }
                templatesData.forEach((t: any) => {
                    newTemplates[t.level] = { subject: t.subject, content: t.content }
                })
                setTemplates(newTemplates)
            }
        } catch (error) {
            console.error('Failed to load dunning data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        setMessage(null)
        try {
            const res = await authenticatedFetch('/api/dunning/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert.' })
            } else {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Fehler beim Speichern der Einstellungen')
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Fehler beim Speichern der Einstellungen.' })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveTemplate = async (level: string) => {
        setSaving(true)
        setMessage(null)
        try {
            const res = await authenticatedFetch('/api/dunning/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level,
                    subject: templates[level].subject,
                    content: templates[level].content
                })
            })

            if (res.ok) {
                setMessage({ type: 'success', text: `Vorlage für ${getLevelName(level)} gespeichert.` })
            } else {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Fehler beim Speichern der Vorlage')
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Fehler beim Speichern der Vorlage.' })
        } finally {
            setSaving(false)
        }
    }

    const getLevelName = (level: string) => {
        switch (level) {
            case 'REMINDER': return 'Zahlungserinnerung'
            case 'WARNING1': return '1. Mahnung'
            case 'WARNING2': return '2. Mahnung'
            case 'FINAL': return 'Letzte Mahnung'
            default: return level
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Laden...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="mx-1" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Automatisches Mahnwesen</h1>
                            <p className="text-gray-600">Konfigurieren Sie Erinnerungen und Mahnstufen für offene Rechnungen.</p>
                        </div>
                    </div>
                </div>

                {message && (
                    <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                        <AlertTitle>{message.type === 'success' ? 'Erfolg' : 'Fehler'}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="settings" className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-lg border">
                        <TabsTrigger value="settings" className="px-6">Einstellungen</TabsTrigger>
                        <TabsTrigger value="templates" className="px-6">E-Mail Vorlagen</TabsTrigger>
                        <TabsTrigger value="shopify" className="px-6">Shopify Automation</TabsTrigger>
                    </TabsList>

                    {/* SHOPIFY AUTOMATION TAB */}
                    <TabsContent value="shopify" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Vorkasse Card */}
                            <Card className="group relative overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-purple-500">
                                <div className="absolute top-0 right-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
                                    <CreditCard className="h-32 w-32 text-purple-600" />
                                </div>
                                <CardHeader>
                                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <CardTitle>Vorkasse-Erinnerungen</CardTitle>
                                    <CardDescription>
                                        Für Banküberweisungen
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-6 text-sm text-gray-500">
                                        Automatische Zahlungserinnerungen für Kunden, die per Banküberweisung zahlen.
                                        Startet den Prozess direkt nach Bestelleingang.
                                    </p>
                                    <Button
                                        onClick={() => router.push('/settings/payment-reminders')}
                                        className="w-full bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 hover:border-purple-300 group-hover:border-purple-400"
                                    >
                                        Konfigurieren
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Rechnung Card */}
                            <Card className="group relative overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-blue-500">
                                <div className="absolute top-0 right-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
                                    <FileText className="h-32 w-32 text-blue-600" />
                                </div>
                                <CardHeader>
                                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <CardTitle>Rechnungskauf-Erinnerungen</CardTitle>
                                    <CardDescription>
                                        Für "Kauf auf Rechnung"
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-6 text-sm text-gray-500">
                                        Erinnerungen und Mahnstufen für Rechnungskäufe.
                                        Inklusive automatischer Stornierung bei Nichtzahlung nach Fristablauf.
                                    </p>
                                    <Button
                                        onClick={() => router.push('/settings/payment-reminders')}
                                        className="w-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 group-hover:border-blue-400"
                                    >
                                        Konfigurieren
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Info Banner */}
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                                <div className="rounded-full bg-white/10 p-3 ring-1 ring-white/20">
                                    <Sparkles className="h-6 w-6 text-yellow-300" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="mb-2 text-lg font-semibold text-white">Intelligente Automatisierung</h4>
                                    <p className="text-slate-300 leading-relaxed">
                                        Dieses System arbeitet unabhängig von der manuellen Rechnungserstellung.
                                        Es synchronisiert sich automatisch mit Ihrem Shopify-Shop, erkennt den Zahlungsstatus
                                        und sendet E-Mails basierend auf Ihren definierten Regeln.
                                    </p>
                                </div>
                                <div className="hidden md:block">
                                    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10">
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                        Aktiv
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* General Activation */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        Aktivierung & Status
                                    </CardTitle>
                                    <CardDescription>
                                        Schalten Sie das automatische Mahnwesen ein oder aus.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="dunning-enabled" className="text-base font-medium">
                                            Automatisches Mahnwesen aktiv
                                        </Label>
                                        <p className="text-sm text-gray-500">
                                            Wenn aktiv, werden täglich E-Mails an säumige Kunden gesendet.
                                        </p>
                                    </div>
                                    <Switch
                                        id="dunning-enabled"
                                        checked={settings.enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                                    />
                                </CardContent>
                            </Card>

                            {/* Intervals */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                        Zeitabstände (Tage)
                                    </CardTitle>
                                    <CardDescription>
                                        Wann sollen die E-Mails versendet werden?
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Erinnerung nach (Tage nach Fälligkeit)</Label>
                                        <Input
                                            type="number"
                                            value={settings.reminderDays}
                                            onChange={(e) => setSettings({ ...settings, reminderDays: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Mahnung 1 (Tage nach Erinnerung)</Label>
                                        <Input
                                            type="number"
                                            value={settings.warning1Days}
                                            onChange={(e) => setSettings({ ...settings, warning1Days: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Mahnung 2 (Tage nach Mahnung 1)</Label>
                                        <Input
                                            type="number"
                                            value={settings.warning2Days}
                                            onChange={(e) => setSettings({ ...settings, warning2Days: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Letzte Mahnung (Tage nach Mahnung 2)</Label>
                                        <Input
                                            type="number"
                                            value={settings.finalWarningDays}
                                            onChange={(e) => setSettings({ ...settings, finalWarningDays: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Surcharges */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Percent className="w-5 h-5 text-red-600" />
                                        Mahngebühren (%)
                                    </CardTitle>
                                    <CardDescription>
                                        Prozentualer Aufschlag auf den Rechnungsbetrag.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label className="text-gray-400">Erinnerung</Label>
                                        <div className="text-sm text-gray-500">Keine Gebühr (0%)</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Mahnung 1 Zuschlag (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={settings.warning1Surcharge}
                                                onChange={(e) => setSettings({ ...settings, warning1Surcharge: parseFloat(e.target.value) })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Mahnung 2 Zuschlag (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={settings.warning2Surcharge}
                                                onChange={(e) => setSettings({ ...settings, warning2Surcharge: parseFloat(e.target.value) })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <Label>Letzte Mahnung Zuschlag (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={settings.finalWarningSurcharge}
                                                onChange={(e) => setSettings({ ...settings, finalWarningSurcharge: parseFloat(e.target.value) })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="md:col-span-2 flex justify-end">
                                <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                    {saving ? 'Speichert...' : 'Einstellungen speichern'}
                                    <Save className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TEMPLATES TAB */}
                    <TabsContent value="templates">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-purple-600" />
                                    E-Mail Vorlagen verwalten
                                </CardTitle>
                                <CardDescription>
                                    Passen Sie die Texte für jede Mahnstufe an. Nutzen Sie Platzhalter wie {'{{ customer_name }}'}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="REMINDER" className="w-full">
                                    <TabsList className="w-full justify-start mb-4 bg-gray-100 p-1">
                                        <TabsTrigger value="REMINDER">Erinnerung</TabsTrigger>
                                        <TabsTrigger value="WARNING1">Mahnung 1</TabsTrigger>
                                        <TabsTrigger value="WARNING2">Mahnung 2</TabsTrigger>
                                        <TabsTrigger value="FINAL">Letzte Mahnung</TabsTrigger>
                                    </TabsList>

                                    {['REMINDER', 'WARNING1', 'WARNING2', 'FINAL'].map((level) => (
                                        <TabsContent key={level} value={level} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Betreff</Label>
                                                <Input
                                                    value={templates[level]?.subject || ''}
                                                    onChange={(e) => {
                                                        const newTemplates = { ...templates }
                                                        newTemplates[level] = { ...newTemplates[level], subject: e.target.value }
                                                        setTemplates(newTemplates)
                                                    }}
                                                    placeholder="z.B. Zahlungserinnerung für Rechnung {{ invoice_number }}"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Inhalt</Label>
                                                <Textarea
                                                    className="min-h-[200px] font-mono text-sm"
                                                    value={templates[level]?.content || ''}
                                                    onChange={(e) => {
                                                        const newTemplates = { ...templates }
                                                        newTemplates[level] = { ...newTemplates[level], content: e.target.value }
                                                        setTemplates(newTemplates)
                                                    }}
                                                    placeholder="Hallo {{ customer_name }}..."
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Verfügbare Platzhalter: {'{{ customer_name }}'}, {'{{ invoice_number }}'}, {'{{ order_number }}'}, {'{{ original_amount }}'}, {'{{ surcharge_amount }}'}, {'{{ total_open_amount }}'}, {'{{ due_date }}'}
                                                </p>
                                            </div>
                                            <div className="flex justify-end pt-4">
                                                <Button onClick={() => handleSaveTemplate(level)} disabled={saving}>
                                                    {saving ? 'Speichert...' : 'Vorlage speichern'}
                                                    <Save className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
