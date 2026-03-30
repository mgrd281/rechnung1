'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react'

export function AnalyticsDashboard() {
    const [data, setData] = useState<any>(null)
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSendingReport, setIsSendingReport] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, productsRes] = await Promise.all([
                    fetch('/api/analytics'),
                    fetch('/api/analytics/top-products')
                ])

                if (!analyticsRes.ok) {
                    const errData = await analyticsRes.json().catch(() => ({}))
                    throw new Error(errData.error || `Analytics API Error: ${analyticsRes.status}`)
                }

                if (!productsRes.ok) {
                    const errData = await productsRes.json().catch(() => ({}))
                    // We can log this but maybe not block the whole dashboard if top products fail
                    console.error('Top products failed:', errData.error)
                    // For now, let's throw to see the error
                    throw new Error(errData.error || `Top Products API Error: ${productsRes.status}`)
                }
                const analyticsData = await analyticsRes.json()
                setData(analyticsData)

                if (productsRes.ok) {
                    const productsData = await productsRes.json()
                    if (productsData.success) {
                        setTopProducts(productsData.topProducts || [])
                    }
                }
            } catch (err: any) {
                console.error('Analytics error:', err)
                setError(err.message || 'Fehler beim Laden der Analysen')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleSendReport = async (month: string, year: string) => {
        setIsSendingReport(true)
        try {
            const res = await fetch('/api/exports/invoices/email-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year })
            })
            const data = await res.json()
            if (data.success) {
                alert(`Bericht für ${month}/${year} wurde erfolgreich an Ihre E-Mail gesendet!`)
            } else {
                throw new Error(data.error || 'Fehler beim Senden')
            }
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsSendingReport(false)
        }
    }

    if (loading) return (
        <div className="w-full h-48 flex items-center justify-center bg-white rounded-lg border border-gray-100 mb-8">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-500">Lade Analysen...</p>
            </div>
        </div>
    )

    if (error) return (
        <div className="w-full h-32 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 mb-8">
            <div className="text-center">
                <p className="text-gray-500 mb-2">{error === 'No organization found' ? 'Organisationsdaten werden eingerichtet...' : 'Analysen konnten nicht geladen werden'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:underline font-medium"
                >
                    Seite aktualisieren
                </button>
            </div>
        </div>
    )

    if (!data || !data.monthlyIncome) return null

    // Format currency
    const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val)

    return (
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Alle Zeiten</p>
                    </CardContent>
                </Card>

                {/* Paid Invoices */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bezahlte Rechnungen</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.paidInvoicesCount}</div>
                        <p className="text-xs text-muted-foreground">Anzahl</p>
                    </CardContent>
                </Card>

                {/* Average Value */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ø Rechnungswert</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.averageInvoiceValue)}</div>
                        <p className="text-xs text-muted-foreground">Durchschnitt</p>
                    </CardContent>
                </Card>

                {/* Active Customers (Placeholder or from top customers count) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Kunde</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{data.topCustomers[0]?.name || '-'}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.topCustomers[0] ? formatCurrency(data.topCustomers[0].totalSpent) : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {/* Chart */}
                <Card className="col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Umsatzentwicklung (Letzte 12 Monate)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.monthlyIncome}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            const [year, month] = value.split('-')
                                            return `${month}/${year.slice(2)}`
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}€`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                        labelFormatter={(label) => {
                                            const [year, month] = label.split('-')
                                            return `${month}/${year}`
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Customers List */}
                <Card className="col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Kunden</CardTitle>
                        <CardDescription>Nur bezahlte und nicht erstattete Umsätze</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topCustomers.map((customer: any, i: number) => (
                                <div key={i} className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none truncate w-[150px]">{customer.name}</p>
                                        <p className="text-xs text-muted-foreground truncate w-[150px]">{customer.email}</p>
                                    </div>
                                    <div className="font-medium text-sm">
                                        {formatCurrency(customer.totalSpent)}
                                    </div>
                                </div>
                            ))}
                            {data.topCustomers.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Keine Daten verfügbar</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Popular Products Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Beliebte Produkte</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-5">
                        {topProducts.map((product: any, i: number) => (
                            <div key={i} className="flex items-start">
                                {/* Rank Number */}
                                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs mr-3 mt-0.5 flex-shrink-0">
                                    {i + 1}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0 mr-4">
                                    {/* Line 1: Name */}
                                    <p className="text-sm font-medium text-gray-900 leading-tight" title={product.name}>
                                        {product.name.length > 60 ? product.name.substring(0, 60) + '...' : product.name}
                                    </p>
                                    {/* Line 2: Quantity */}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {product.quantity} Stück verkauft
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                                    {formatCurrency(product.revenue)}
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Keine Daten verfügbar</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Reports Section */}
            <Card className="border-violet-200 bg-violet-50/50">
                <CardHeader>
                    <CardTitle className="text-violet-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Zusammenfassungen & Reports
                    </CardTitle>
                    <CardDescription className="text-violet-600">Senden Sie sich detaillierte Excel-Auswertungen direkt per E-Mail.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <button
                            disabled={isSendingReport}
                            onClick={() => handleSendReport('08', '2025')}
                            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-violet-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSendingReport ? 'Sendet...' : 'Report August 2025 senden'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
