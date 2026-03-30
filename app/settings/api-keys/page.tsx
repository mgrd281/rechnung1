'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, Copy, Check, ShieldCheck, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/layout/page-header'

interface ApiKey {
    id: string
    name: string
    key: string
    lastUsedAt: string | null
    createdAt: string
}

export default function ApiKeysPage() {
    const [masterKey, setMasterKey] = useState<ApiKey | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showKey, setShowKey] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        loadKeys()
    }, [])

    const loadKeys = async () => {
        try {
            const response = await fetch('/api/settings/api-keys')
            if (response.ok) {
                const data = await response.json()
                // Take the first key as Master Key or null
                if (data.length > 0) {
                    setMasterKey(data[0])
                } else {
                    setMasterKey(null)
                }
            }
        } catch (error) {
            console.error('Error loading API keys:', error)
            showToast('Laden fehlgeschlagen', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateKey = async () => {
        setProcessing(true)
        try {
            // First, delete existing keys if any (to enforce "One Key" policy roughly)
            // But for now, we just create a new one and set it as master
            const response = await fetch('/api/settings/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Master Key' })
            })

            if (response.ok) {
                const data = await response.json()
                setMasterKey(data)
                showToast('Master Key erstellt', 'success')
            } else {
                throw new Error('Failed')
            }
        } catch (error) {
            console.error('Error creating key:', error)
            showToast('Erstellung fehlgeschlagen', 'error')
        } finally {
            setProcessing(false)
        }
    }

    const handleRegenerateKey = async () => {
        if (!masterKey) return
        if (!confirm('Sind Sie sicher? Der alte Schlüssel wird sofort ungültig. Alle verbundenen Dienste verlieren den Zugriff.')) return

        setProcessing(true)
        try {
            // Delete old key
            await fetch(`/api/settings/api-keys/${masterKey.id}`, { method: 'DELETE' })

            // Create new key
            const response = await fetch('/api/settings/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Master Key' })
            })

            if (response.ok) {
                const data = await response.json()
                setMasterKey(data)
                showToast('Master Key neu generiert', 'success')
            }
        } catch (error) {
            console.error('Error regenerating key:', error)
            showToast('Fehler beim Neugenerieren', 'error')
        } finally {
            setProcessing(false)
        }
    }

    const copyToClipboard = () => {
        if (masterKey?.key) {
            navigator.clipboard.writeText(masterKey.key)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            showToast('In die Zwischenablage kopiert', 'success')
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Master API Key"
                subtitle="Unbeschränkter Zugriff auf alle Ihre Daten"
            />

            <div className="space-y-6">
                <Alert className="bg-blue-50 border-blue-100 rounded-xl p-4">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <div className="ml-3">
                        <AlertTitle className="text-blue-900 font-bold">Universeller Zugriff</AlertTitle>
                        <AlertDescription className="text-blue-700 mt-1">
                            Dieser Master Key gewährt externen Anwendungen **vollen Zugriff** auf alle Ihre Daten. Geben Sie ihn nur an vertrauenswürdige Parteien weiter.
                        </AlertDescription>
                    </div>
                </Alert>

                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-slate-900">Ihr Master Key</CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                            Verwenden Sie diesen Schlüssel zur Authentifizierung Ihrer Anfragen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                            </div>
                        ) : !masterKey ? (
                            <div className="text-center py-8">
                                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Key className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Kein aktiver Schlüssel</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    Generieren Sie einen Master Key, um externen Zugriff zu ermöglichen.
                                </p>
                                <Button
                                    onClick={handleGenerateKey}
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                                    Master Key generieren
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                        API Access Token
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                readOnly
                                                type={showKey ? 'text' : 'password'}
                                                value={masterKey.key}
                                                className="font-mono text-lg bg-slate-50 border-slate-200 h-12 pr-24 text-slate-700 focus:ring-slate-900 rounded-lg"
                                            />
                                            <div className="absolute right-3 top-0 h-full flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-slate-900"
                                                    onClick={() => setShowKey(!showKey)}
                                                >
                                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={copyToClipboard}
                                            className="h-12 px-6 font-bold"
                                            variant="outline"
                                        >
                                            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : <Copy className="h-4 w-4 mr-2" />}
                                            {copied ? 'Kopiert' : 'Kopieren'}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 font-medium">
                                        Erstellt am {new Date(masterKey.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        <p>Benötigen Sie einen neuen Schlüssel?</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={handleRegenerateKey}
                                        disabled={processing}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                        Neu generieren
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {masterKey && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="border-b bg-slate-50/50 py-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" /> Dokumentation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 text-sm text-slate-600 space-y-4">
                                <p>Nutzen Sie den Header <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">x-api-key</code> für alle Anfragen.</p>
                                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner">
                                    curl -H "x-api-key: {masterKey.key.substring(0, 8)}..." \
                                    <br />https://api.example.com/v1/orders
                                </div>
                                <div className="pt-2">
                                    <Link href="/api/docs" className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 group">
                                        Zur vollständigen Dokumentation <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="border-b bg-slate-50/50 py-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-900">Status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                                        <Check className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-lg">Aktiv</div>
                                        <div className="text-xs text-slate-500 font-medium">
                                            Zuletzt genutzt: {masterKey.lastUsedAt ? new Date(masterKey.lastUsedAt).toLocaleString() : 'Noch nie'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
            
        </div>
    )
}
