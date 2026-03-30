'use client'

import { useState, useEffect } from 'react'
import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { BackButton } from '@/components/navigation/back-button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { ArrowLeft, RefreshCw, Calendar, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57']

export default function ConversionPage() {
  const authenticatedFetch = useAuthenticatedFetch()
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await authenticatedFetch(`/api/conversions/overview?range=${range}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const [backfilling, setBackfilling] = useState(false)
  
  const handleBackfill = async () => {
    if (!confirm('Möchten Sie historische Daten für bestehende Rechnungen nachladen? Dies kann einige Minuten dauern.')) return
    
    setBackfilling(true)
    try {
        let remaining = 1
        let processed = 0
        while (remaining > 0) {
            const res = await authenticatedFetch('/api/admin/backfill-sources?limit=20')
            const data = await res.json()
            remaining = data.remaining
            processed += data.processed
            
            // Update UI or toast?
            console.log(`Backfilled ${processed} invoices, ${remaining} remaining...`)
            
            if (data.processed === 0 && remaining > 0) {
                console.warn('Stuck backfilling?')
                break; 
            }
        }
        alert('Backfill abgeschlossen! Bitte Seite aktualisieren.')
        fetchData()
    } catch (e) {
        console.error(e)
        alert('Fehler beim Backfill')
    } finally {
        setBackfilling(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [range])

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold text-gray-700">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} style={{ color: p.color }} className="text-sm">
              {p.name}: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const sources = data?.sources || []
  const chartData = data?.chartData || []
  const totals = data?.totals || { revenue: 0, orders: 0 }

  const topSource = sources.length > 0 ? sources[0] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <BackButton fallbackUrl="/dashboard" />
              <h1 className="text-2xl font-bold text-gray-900">Conversion Überblick</h1>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" onClick={handleBackfill} disabled={backfilling}>
                  {backfilling ? 'Lade Daten...' : 'Historische Daten nachladen'}
               </Button>
               <HeaderNavIcons />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <Tabs value={range} onValueChange={setRange} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="today">Heute</TabsTrigger>
              <TabsTrigger value="7d">7 Tage</TabsTrigger>
              <TabsTrigger value="30d">30 Tage</TabsTrigger>
              <TabsTrigger value="90d">90 Tage</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Gesamtumsatz</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.revenue)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">in diesem Zeitraum</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Bestellungen</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totals.orders}</div>
                    <p className="text-xs text-gray-400 mt-1">konvertierte Verkäufe</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Top Quelle</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate">
                        {topSource ? topSource.label : '-'}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {topSource ? `${Math.round((topSource.revenue / totals.revenue) * 100)}% vom Umsatz` : 'Keine Daten'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Ø Warenkorb</CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                         {totals.orders > 0 
                            ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.revenue / totals.orders)
                            : '-'}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Durchschnittswert</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Main Bar Chart */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Umsatz nach Quellen & Zeit</CardTitle>
                    <CardDescription>Tägliche Umsatzentwicklung aufgeschlüsselt nach Traffic-Quelle</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(val) => format(new Date(val), 'dd.MM')}
                                fontSize={12}
                            />
                            <YAxis 
                                tickFormatter={(val) => `€${val}`}
                                fontSize={12}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {sources.slice(0, 5).map((source: any, index: number) => (
                                <Bar 
                                    key={source.key} 
                                    dataKey={source.key} 
                                    name={source.label} 
                                    stackId="a" 
                                    fill={COLORS[index % COLORS.length]} 
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Umsatzanteil</CardTitle>
                    <CardDescription>Verteilung nach Quelle</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sources}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="revenue"
                                nameKey="label"
                            >
                                {sources.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        {/* Detailed Table */}
        <Card>
            <CardHeader>
                <CardTitle>Details nach Quelle</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 bg-gray-50 border-b">
                            <tr>
                                <th className="py-3 px-4 font-medium">Quelle</th>
                                <th className="py-3 px-4 font-medium text-right">Anzahl</th>
                                <th className="py-3 px-4 font-medium text-right">Umsatz</th>
                                <th className="py-3 px-4 font-medium text-right">Anteil</th>
                                <th className="py-3 px-4 font-medium text-right">Ø Wert</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sources.map((source: any) => (
                                <tr key={source.key} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-900">{source.label}</td>
                                    <td className="py-3 px-4 text-right">{source.count}</td>
                                    <td className="py-3 px-4 text-right font-medium">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(source.revenue)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-gray-500">
                                        {((source.revenue / totals.revenue) * 100).toFixed(1)}%
                                    </td>
                                    <td className="py-3 px-4 text-right text-gray-500">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(source.avgOrder)}
                                    </td>
                                </tr>
                            ))}
                            {sources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        Keine Daten für diesen Zeitraum verfügbar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

      </main>
    </div>
  )
}
