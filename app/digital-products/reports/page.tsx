'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Activity, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function ReportsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/digital-products/reports')
            const json = await res.json()
            if (json.success) {
                setData(json.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Laden...</div>
    if (!data) return <div className="p-8 text-center">Keine Daten verfügbar</div>

    const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    )

    const ProductTable = ({ products }: { products: any[] }) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-4 py-3">Produkt</th>
                        <th className="px-4 py-3 text-right">Verkäufe (Keys)</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length === 0 ? (
                        <tr>
                            <td colSpan={2} className="px-4 py-4 text-center text-gray-500">Keine Verkäufe in diesem Zeitraum</td>
                        </tr>
                    ) : (
                        products.map((p: any, i: number) => (
                            <tr key={i} className="border-b">
                                <td className="px-4 py-3 font-medium">{p.title}</td>
                                <td className="px-4 py-3 text-right">{p.count}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <HeaderNavIcons />
                    <h1 className="text-xl font-bold text-gray-900">Berichte & Statistiken</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="daily" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="daily">Heute (24h)</TabsTrigger>
                        <TabsTrigger value="weekly">Woche (7 Tage)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                title="Verkaufte Keys"
                                value={data.daily.count}
                                subtext="In den letzten 24 Stunden"
                                icon={ShoppingCart}
                                color="blue"
                            />
                            <StatCard
                                title="Umsatz (ca.)"
                                value={`€${data.daily.revenue.toFixed(2)}`}
                                subtext="Basierend auf verknüpften Bestellungen"
                                icon={DollarSign}
                                color="green"
                            />
                            <StatCard
                                title="Top Produkt"
                                value={data.daily.byProduct[0]?.title || '-'}
                                subtext={data.daily.byProduct[0] ? `${data.daily.byProduct[0].count} Verkäufe` : ''}
                                icon={TrendingUp}
                                color="purple"
                            />
                        </div>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Verkäufe nach Produkt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProductTable products={data.daily.byProduct} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="weekly" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                title="Verkaufte Keys"
                                value={data.weekly.count}
                                subtext="In den letzten 7 Tagen"
                                icon={ShoppingCart}
                                color="blue"
                            />
                            <StatCard
                                title="Umsatz (ca.)"
                                value={`€${data.weekly.revenue.toFixed(2)}`}
                                subtext="Basierend auf verknüpften Bestellungen"
                                icon={DollarSign}
                                color="green"
                            />
                            <StatCard
                                title="Top Produkt"
                                value={data.weekly.byProduct[0]?.title || '-'}
                                subtext={data.weekly.byProduct[0] ? `${data.weekly.byProduct[0].count} Verkäufe` : ''}
                                icon={TrendingUp}
                                color="purple"
                            />
                        </div>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Verkäufe nach Produkt (Woche)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProductTable products={data.weekly.byProduct} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
