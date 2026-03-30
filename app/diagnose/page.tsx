'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Play, Database, AlertCircle, CheckCircle } from 'lucide-react'

export default function DiagnosePage() {
    const authenticatedFetch = useAuthenticatedFetch()
    const [logs, setLogs] = useState<string[]>([])
    const [recentData, setRecentData] = useState<{
        expenses: any[],
        income: any[],
        invoices: any[]
    } | null>(null)
    const [loading, setLoading] = useState(false)

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => [`[${timestamp}] ${msg}`, ...prev])
    }

    const fetchRecentData = async () => {
        setLoading(true)
        addLog('Fetching recent data from APIs...')
        try {
            // Use a wide date range to ensure we get everything
            const params = new URLSearchParams({
                startDate: '2020-01-01',
                endDate: '2030-12-31'
            })

            addLog('Requesting Expenses...')
            const expRes = await authenticatedFetch(`/api/accounting/expenses?${params}`)
            const expData = await expRes.json()
            addLog(`Expenses response status: ${expRes.status}`)
            if (expData.debug) addLog(`Expenses Org ID: ${expData.debug.organizationId}`)

            addLog('Requesting Additional Income...')
            const incRes = await authenticatedFetch(`/api/accounting/additional-income?${params}`)
            const incData = await incRes.json()
            addLog(`Income response status: ${incRes.status}`)
            if (incData.debug) addLog(`Income Org ID: ${incData.debug.organizationId}`)

            addLog('Requesting Invoices...')
            const invRes = await authenticatedFetch(`/api/invoices?page=1&limit=10`)
            const invData = await invRes.json()
            addLog(`Invoices response status: ${invRes.status}`)

            const newData = {
                expenses: Array.isArray(expData) ? expData : (expData.expenses || []),
                income: Array.isArray(incData) ? incData : (incData.data || []),
                invoices: invData.invoices || []
            }

            setRecentData(newData)
            addLog(`Data fetch complete. Found ${newData.expenses.length} expenses, ${newData.income.length} income, ${newData.invoices.length} invoices.`)
            return newData
        } catch (e: any) {
            addLog(`Error fetching data: ${e.message}`)
            console.error(e)
            return null
        } finally {
            setLoading(false)
        }
    }

    const runSimulation = async (type: 'expense' | 'income') => {
        setLoading(true)
        addLog(`Starting simulation for ${type.toUpperCase()} import...`)

        const testNumber = `TEST-${Math.floor(Math.random() * 10000)}`

        const payload = {
            importTarget: 'accounting',
            accountingType: type,
            invoices: [
                {
                    number: testNumber,
                    date: new Date().toISOString(),
                    subtotal: 100,
                    taxAmount: 19,
                    total: 119,
                    customerName: 'Diagnose Tool Test',
                    items: [{ description: `Test ${type} Item` }],
                    // Add fields that might be required
                    customerAddress: 'Test Street 1',
                    customerCity: 'Test City',
                    customerZip: '12345',
                    customerCountry: 'Germany'
                }
            ]
        }

        addLog(`Sending payload: ${JSON.stringify(payload, null, 2)}`)

        try {
            const res = await authenticatedFetch('/api/invoices/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            addLog(`API Response (${res.status}): ${JSON.stringify(data, null, 2)}`)

            if (res.ok) {
                addLog('Simulation reported success. Refreshing data to verify persistence...')
                const freshData = await fetchRecentData()

                if (freshData) {
                    // Verify if we can find our test item
                    const found = type === 'expense'
                        ? freshData.expenses?.find((e: any) => e.expenseNumber === testNumber)
                        : freshData.income?.find((i: any) => i.description?.includes(testNumber) || i.amount === 119)

                    if (found) {
                        addLog(`SUCCESS: Found created ${type} record in database!`)
                    } else {
                        addLog(`WARNING: API reported success but record was not found in the list immediately.`)
                    }
                }
            } else {
                addLog('Simulation failed.')
            }
        } catch (e: any) {
            addLog(`Simulation error: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    const [stats, setStats] = useState<any>(null)

    const fetchStats = async () => {
        try {
            const res = await authenticatedFetch('/api/diagnose/stats')
            const data = await res.json()
            if (data.success) {
                setStats(data)
            }
        } catch (e) {
            console.error("Failed to fetch stats", e)
        }
    }

    useEffect(() => {
        fetchRecentData()
        fetchStats()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Diagnose</h1>
                        <p className="text-gray-500">Überprüfen Sie die Import-Funktionalität</p>
                    </div>
                    <Button onClick={() => { fetchRecentData(); fetchStats(); }} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Daten aktualisieren
                    </Button>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Gesamt Einnahmen (DB)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.counts.additionalIncome}</div>
                                <p className="text-xs text-gray-500">Importierte & Manuelle Einträge</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Rechnungen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.counts.invoices}</div>
                                <p className="text-xs text-gray-500">Erstellte Rechnungen</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Ausgaben</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.counts.expenses}</div>
                                <p className="text-xs text-gray-500">Erfasste Ausgaben</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Verteilung (Jahre)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs space-y-1">
                                    {Object.entries(stats.distribution.incomeByYear).map(([year, count]: any) => (
                                        <div key={year} className="flex justify-between">
                                            <span>{year}:</span>
                                            <span className="font-bold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Simulation Tools */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Play className="mr-2 h-5 w-5 text-blue-600" />
                                Import Simulation
                            </CardTitle>
                            <CardDescription>
                                Testen Sie den Import-Prozess mit Testdaten
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => runSimulation('expense')}
                                    disabled={loading}
                                    variant="outline"
                                    className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                                >
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <Database className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <span>Test Import: Ausgabe</span>
                                </Button>

                                <Button
                                    onClick={() => runSimulation('income')}
                                    disabled={loading}
                                    variant="outline"
                                    className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
                                >
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <Database className="h-6 w-6 text-green-600" />
                                    </div>
                                    <span>Test Import: Einnahme</span>
                                </Button>
                            </div>

                            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs h-64 overflow-y-auto">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">{log}</div>
                                ))}
                                {logs.length === 0 && <div className="text-gray-500 italic">Warte auf Aktionen...</div>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Data View */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Database className="mr-2 h-5 w-5 text-purple-600" />
                                Datenbank Status (Letzte Einträge)
                            </CardTitle>
                            <CardDescription>
                                Live-Ansicht der gespeicherten Daten (2020-2030)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="expenses">
                                <TabsList className="w-full">
                                    <TabsTrigger value="expenses" className="flex-1">Ausgaben ({recentData?.expenses?.length || 0})</TabsTrigger>
                                    <TabsTrigger value="income" className="flex-1">Einnahmen ({recentData?.income?.length || 0})</TabsTrigger>
                                    <TabsTrigger value="invoices" className="flex-1">Rechnungen ({recentData?.invoices?.length || 0})</TabsTrigger>
                                </TabsList>

                                <TabsContent value="expenses" className="mt-4">
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nr.</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Betrag</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {recentData?.expenses?.slice(0, 10).map((item: any) => (
                                                    <tr key={item.id}>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{item.expenseNumber}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2 text-sm text-right font-medium">€{Number(item.totalAmount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                {(!recentData?.expenses || recentData.expenses.length === 0) && (
                                                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">Keine Daten</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="income" className="mt-4">
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Beschreibung</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Betrag</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {recentData?.income?.slice(0, 10).map((item: any) => (
                                                    <tr key={item.id}>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2 text-sm text-right font-medium">€{Number(item.amount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                {(!recentData?.income || recentData.income.length === 0) && (
                                                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">Keine Daten</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="invoices" className="mt-4">
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nr.</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Betrag</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {recentData?.invoices?.slice(0, 10).map((item: any) => (
                                                    <tr key={item.id}>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{item.invoiceNumber}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-500">{item.customerName}</td>
                                                        <td className="px-3 py-2 text-sm text-right font-medium">€{Number(item.totalGross || item.totalAmount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                {(!recentData?.invoices || recentData.invoices.length === 0) && (
                                                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">Keine Daten</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
