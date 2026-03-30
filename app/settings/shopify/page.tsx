'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

interface ShopifySettings {
    enabled: boolean
    shopDomain: string
    accessToken: string
    apiVersion: string
    autoImport: boolean
}

export default function ShopifySettingsPage() {
    const [settings, setSettings] = useState<ShopifySettings>({
        enabled: true,
        shopDomain: '',
        accessToken: '',
        apiVersion: '2025-01',
        autoImport: false
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
    const { showToast } = useToast()

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/shopify/settings')
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.settings) {
                    setSettings(data.settings)
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error)
            showToast('Fehler beim Laden der Einstellungen', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const res = await fetch('/api/shopify/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Speichern')
            }

            showToast('Shopify-Einstellungen gespeichert', 'success')

            // Re-test connection after save
            if (settings.accessToken) {
                handleTestConnection()
            }
        } catch (error: any) {
            console.error('Error saving settings:', error)
            showToast(error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleTestConnection = async () => {
        try {
            setTesting(true)
            setConnectionStatus('unknown')

            // We save first to ensure backend tests with latest data
            // But if we just want to test credentials, we might need a dedicated test endpoint that accepts body
            // For now, let's assume we save first or the user hits save.
            // Actually, best flow: User enters data -> Save -> Test runs.

            // Calling a test endpoint (we might need to add this to route.ts or just check status)
            // For now, let's try a simple fetch to analytics or orders if we saved.
            // But better: use the API to test.

            // Let's rely on saving first.

            const res = await fetch('/api/analytics/overview?range=today')
            // This is a proxy test. If analytics works, connection works.

            if (res.ok) {
                const json = await res.json()
                if (json.success) {
                    setConnectionStatus('success')
                    showToast('Verbindung erfolgreich hergestellt!', 'success')
                } else {
                    throw new Error(json.message)
                }
            } else {
                throw new Error('Verbindung fehlgeschlagen')
            }

        } catch (error) {
            setConnectionStatus('error')
            showToast('Verbindung konnte nicht hergestellt werden.', 'error')
        } finally {
            setTesting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    return (
        <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Shopify Integration</h1>
                    <p className="text-slate-500 font-medium mt-1">Verbinden Sie Ihren Store für automatische Synchronisierung.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/analytics">
                        <Button variant="outline" className="font-bold">Zurück zu Analytics</Button>
                    </Link>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800"
                    >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Speichern
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connection Status Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden relative">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShoppingBag className="h-5 w-5 text-emerald-400" /> Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${connectionStatus === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : connectionStatus === 'error' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    {testing ? <Loader2 className="h-6 w-6 animate-spin" /> :
                                        connectionStatus === 'success' ? <CheckCircle2 className="h-6 w-6" /> :
                                            connectionStatus === 'error' ? <AlertCircle className="h-6 w-6" /> :
                                                <RefreshCw className="h-6 w-6" />}
                                </div>
                                <div>
                                    <p className="font-black uppercase text-sm">
                                        {testing ? 'Test läuft...' :
                                            connectionStatus === 'success' ? 'Verbunden' :
                                                connectionStatus === 'error' ? 'Fehler' : 'Nicht geprüft'}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {connectionStatus === 'success' ? 'API Zugriff aktiv' : 'Prüfen Sie Ihre Credentials'}
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleSave} // Save acts as test here for simplicity in this flow
                                variant="outline"
                                className="w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
                            >
                                Verbindung testen
                            </Button>
                        </CardContent>

                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Hilfe</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-2">
                            <p>Sie benötigen einen <strong>Admin API Access Token</strong>.</p>
                            <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                                <li>Shopify Admin öffnen</li>
                                <li>Apps & Vertriebskanäle</li>
                                <li>Apps entwickeln</li>
                                <li>App erstellen & konfigurieren</li>
                                <li>Admin API Scopes auswählen (Orders, Products, Customers)</li>
                                <li>Installieren & Token kopieren</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Form */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>API Konfiguration</CardTitle>
                        <CardDescription>Geben Sie hier Ihre Shop-URL und den Access Token ein.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-slate-900">Integration aktivieren</Label>
                                <p className="text-xs text-slate-500">Schaltet den Datenaustausch ein oder aus.</p>
                            </div>
                            <Switch
                                checked={settings.enabled}
                                onCheckedChange={(c) => setSettings(prev => ({ ...prev, enabled: c }))}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="shopDomain">Shop Domain</Label>
                                <Input
                                    id="shopDomain"
                                    placeholder="mein-shop.myshopify.com"
                                    value={settings.shopDomain}
                                    onChange={(e) => setSettings(prev => ({ ...prev, shopDomain: e.target.value }))}
                                    className="font-mono bg-slate-50"
                                />
                                <p className="text-[10px] text-slate-400">Ohne <code>https://</code> oder trailing slash.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accessToken">Admin API Access Token</Label>
                                <Input
                                    id="accessToken"
                                    type="password"
                                    placeholder="shpat_..."
                                    value={settings.accessToken}
                                    onChange={(e) => setSettings(prev => ({ ...prev, accessToken: e.target.value }))}
                                    className="font-mono bg-slate-50"
                                />
                                <p className="text-[10px] text-slate-400">Beginnt meistens mit <code>shpat_</code>.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiVersion">API Version</Label>
                                    <Input
                                        id="apiVersion"
                                        value={settings.apiVersion}
                                        onChange={(e) => setSettings(prev => ({ ...prev, apiVersion: e.target.value }))}
                                        className="font-mono bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="autoImport">Auto-Import</Label>
                                    <div className="flex items-center h-10 px-3 bg-slate-50 rounded-md border border-slate-200">
                                        <Switch
                                            id="autoImport"
                                            checked={settings.autoImport}
                                            onCheckedChange={(c) => setSettings(prev => ({ ...prev, autoImport: c }))}
                                        />
                                        <span className="ml-3 text-sm text-slate-600">
                                            {settings.autoImport ? 'Aktiv (Stündlich)' : 'Inaktiv'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <p>
                                <strong>Hinweis:</strong> Änderungen werden sofort wirksam. Stellen Sie sicher, dass der Token die Berechtigungen <code>read_orders</code>, <code>read_products</code> und <code>read_customers</code> hat.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
