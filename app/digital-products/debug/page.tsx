'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function DigitalProductsDebugPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/debug/digital-products')
            const json = await res.json()
            setData(json)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return <div className="p-8">Laden...</div>

    if (!data) return <div className="p-8">Fehler beim Laden der Daten.</div>

    const userOrgId = data.currentUser?.organizationId
    const hasProducts = data.products && data.products.length > 0

    const fixProducts = async () => {
        if (!confirm('Möchten Sie alle Produkte in Ihre Organisation verschieben?')) return
        setLoading(true)
        try {
            const res = await fetch('/api/debug/fix-products', { method: 'POST' })
            const json = await res.json()
            alert(json.message)
            fetchData()
        } catch (e) {
            alert('Fehler beim Reparieren')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Digital Products Debugger</h1>
                <div className="space-x-2">
                    <Button onClick={fixProducts} variant="destructive">
                        <CheckCircle className="mr-2 h-4 w-4" /> Alle Produkte reparieren
                    </Button>
                    <Button onClick={fetchData} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Aktualisieren
                    </Button>
                </div>
            </div>

            {/* 1. User Context */}
            <Card>
                <CardHeader><CardTitle>1. Benutzer & Session</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border rounded">
                            <p className="text-sm text-gray-500">Eingeloggt als</p>
                            <p className="font-mono font-bold">{data.session?.user?.email || 'Nicht eingeloggt'}</p>
                        </div>
                        <div className="p-4 bg-white border rounded">
                            <p className="text-sm text-gray-500">Zugeordnete Organisation (User DB)</p>
                            <p className="font-mono font-bold">
                                {data.currentUser?.organization?.name || 'Keine Organisation'}
                                <span className="block text-xs text-gray-400 font-normal">{userOrgId || 'NULL'}</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Products Analysis */}
            <Card>
                <CardHeader><CardTitle>2. Produkte in Datenbank ({data.totalProducts})</CardTitle></CardHeader>
                <CardContent>
                    {!hasProducts ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Die Datenbank ist leer. Es wurden keine digitalen Produkte gefunden.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.products.map((p: any) => {
                                const isVisible = p.organizationId === userOrgId
                                return (
                                    <div key={p.id} className={`p-4 border rounded flex justify-between items-center ${isVisible ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <div>
                                            <p className="font-bold">{p.title}</p>
                                            <p className="text-xs text-gray-500">Shopify ID: {p.shopifyProductId}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Gehört zu Org: <span className="font-mono">{p.organization?.name} ({p.organizationId})</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {isVisible ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Sichtbar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Versteckt (Falsche Org)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Organizations */}
            <Card>
                <CardHeader><CardTitle>3. Alle Organisationen ({data.totalOrgs})</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {data.organizations.map((org: any) => (
                            <div key={org.id} className="p-2 border rounded bg-white text-sm flex justify-between">
                                <span>{org.name}</span>
                                <span className="font-mono text-gray-400">{org.id}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
