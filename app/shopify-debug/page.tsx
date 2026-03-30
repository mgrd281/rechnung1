
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react'

export default function ShopifyDebugPage() {
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    const [syncResult, setSyncResult] = useState<any>(null)
    const [syncing, setSyncing] = useState(false)

    const runDiagnosis = async () => {
        setLoading(true)
        setLogs([])
        try {
            const res = await fetch('/api/shopify/debug-connection')
            const data = await res.json()
            setStatus(data)
        } catch (error: any) {
            setStatus({ error: error.message })
        } finally {
            setLoading(false)
        }
    }

    const forceSync = async () => {
        setSyncing(true)
        setSyncResult(null)
        try {
            const res = await fetch('/api/shopify/auto-sync')
            const data = await res.json()
            setSyncResult(data)
            // Refresh diagnosis after sync
            runDiagnosis()
        } catch (error: any) {
            setSyncResult({ error: error.message })
        } finally {
            setSyncing(false)
        }
    }

    useEffect(() => {
        runDiagnosis()
    }, [])

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Shopify Connection Diagnosis</h1>
                <div className="space-x-2">
                    <Button onClick={forceSync} disabled={syncing || loading} variant="secondary">
                        {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Force Sync Now
                    </Button>
                    <Button onClick={runDiagnosis} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Run Diagnosis
                    </Button>
                </div>
            </div>

            {syncResult && (
                <Card className="mb-6 border-blue-500 bg-blue-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-blue-700">Sync Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs overflow-auto max-h-60 p-2 bg-white rounded border">
                            {JSON.stringify(syncResult, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {status && (
                <div className="grid gap-6">
                    {/* 1. Environment Variables */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-lg">
                                1. Environment Variables
                                {status.env?.ok ?
                                    <CheckCircle className="ml-auto text-green-500" /> :
                                    <XCircle className="ml-auto text-red-500" />
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b pb-2">
                                    <span>SHOPIFY_SHOP_DOMAIN:</span>
                                    <span className="font-mono">{status.env?.shopDomain || 'MISSING'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span>SHOPIFY_ACCESS_TOKEN:</span>
                                    <span className="font-mono">
                                        {status.env?.hasToken ? '✅ Present (Hidden)' : '❌ MISSING'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Shopify API Connection */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-lg">
                                2. Shopify API Connection
                                {status.connection?.success ?
                                    <CheckCircle className="ml-auto text-green-500" /> :
                                    <XCircle className="ml-auto text-red-500" />
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={status.connection?.success ? "text-green-600" : "text-red-600"}>
                                {status.connection?.message}
                            </p>
                            {status.connection?.shop && (
                                <div className="mt-2 bg-slate-100 p-2 rounded text-sm">
                                    Shop Name: {status.connection.shop.name}<br />
                                    Email: {status.connection.shop.email}<br />
                                    Currency: {status.connection.shop.currency}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Order Fetch Test */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-lg">
                                3. Order Fetch Test (Last 5 Orders)
                                {status.orders?.success ?
                                    <CheckCircle className="ml-auto text-green-500" /> :
                                    <AlertTriangle className="ml-auto text-yellow-500" />
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2">
                                Found: <strong>{status.orders?.count || 0}</strong> orders
                            </div>
                            {status.orders?.samples && status.orders.samples.length > 0 ? (
                                <div className="bg-slate-900 text-slate-50 p-4 rounded overflow-auto max-h-60 text-xs font-mono">
                                    {JSON.stringify(status.orders.samples, null, 2)}
                                </div>
                            ) : (
                                <div className="text-yellow-600">No orders found. Check date range or permissions.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 4. Storage System */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-lg">
                                4. Storage System (/tmp)
                                {status.storage?.ok ?
                                    <CheckCircle className="ml-auto text-green-500" /> :
                                    <XCircle className="ml-auto text-red-500" />
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>Invoices in Storage: <strong>{status.storage?.invoiceCount}</strong></div>
                            <div>Storage Path: <code className="text-xs bg-slate-100 p-1 rounded">{status.storage?.path}</code></div>
                        </CardContent>
                    </Card>

                </div>
            )}
        </div>
    )
}
