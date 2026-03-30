'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ImportSuccessBanner } from '@/components/ui/import-success-banner'
import {
    FileText,
    ArrowLeft,
    Home,
    Plus,
    Upload,
    Search,
    Filter,
    X,
    Calendar,
    Euro,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    CalendarDays,
    Receipt
} from 'lucide-react'

export default function PurchaseInvoicesPage() {
    const router = useRouter()
    const authenticatedFetch = useAuthenticatedFetch()

    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                status: statusFilter,
                limit: '50'
            })
            const res = await authenticatedFetch(`/api/purchase-invoices?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setInvoices(data.data)
                setStats(data.stats)
            } else {
                toast.error('Fehler beim Laden der Rechnungen')
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }, [authenticatedFetch, searchQuery, statusFilter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices()
        }, 300) // Debounce search
        return () => clearTimeout(timer)
    }, [fetchInvoices])

    return (
        <div className="min-h-screen bg-gray-50">
            <ImportSuccessBanner />
            <div className="container mx-auto p-6 max-w-7xl space-y-8 pb-32">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="mx-1" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Einkaufsrechnungen</h1>
                            <p className="text-sm text-slate-500">Verwalten Sie Ihre Ausgaben und Belege zentral</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/upload">
                            <Button variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" /> Import (CSV)
                            </Button>
                        </Link>
                        <Link href="/purchase-invoices/new">
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="h-4 w-4" /> Neue Rechnung
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Offene Rechnungen</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    {stats ? `${stats.openAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '0,00 €'}
                                </h3>
                            </div>
                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Bezahlt (Gesamt)</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    {stats ? `${stats.paidAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '0,00 €'}
                                </h3>
                            </div>
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Ausgaben Gesamt</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    {stats ? `${stats.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '0,00 €'}
                                </h3>
                            </div>
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Euro className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Suchen nach Lieferant, Nr..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                        >
                            Alle
                        </Button>
                        <Button
                            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('PENDING')}
                        >
                            Offen
                        </Button>
                        <Button
                            variant={statusFilter === 'PAID' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('PAID')}
                        >
                            Bezahlt
                        </Button>
                    </div>
                </div>

                {/* Invoices List */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg">Rechnungsübersicht</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Beleg #</th>
                                        <th className="px-6 py-3 font-medium">Lieفرant</th>
                                        <th className="px-6 py-3 font-medium">Datum</th>
                                        <th className="px-6 py-3 font-medium">Kategorie</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Betrag</th>
                                        <th className="px-6 py-3 font-medium text-right">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                    <p className="text-slate-500">Lade Rechnungen...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
                                                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                                        <Receipt className="h-8 w-8 text-slate-400" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-slate-900 font-semibold text-lg">Keine Rechnungen gefunden</p>
                                                        <p className="text-slate-500 max-w-xs mx-auto">
                                                            Es wurden keine Rechnungen für Ihre aktuelle Suche oder Filterung gefunden.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id} className="bg-white hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-blue-600">
                                                    {inv.invoiceNumber}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {inv.vendorName}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {new Date(inv.invoiceDate).toLocaleDateString('de-DE')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="font-normal">
                                                        {inv.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {inv.status === 'PAID' ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Bezahlt</Badge>
                                                    ) : (
                                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">Offen</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                                    {Number(inv.totalGross).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors"
                                                        onClick={async () => {
                                                            if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
                                                                try {
                                                                    const res = await authenticatedFetch(`/api/purchase-invoices/${inv.id}`, { method: 'DELETE' })
                                                                    if (res.ok) {
                                                                        toast.success('Rechnung gelöscht')
                                                                        fetchInvoices()
                                                                    } else {
                                                                        toast.error('Fehler beim Löschen')
                                                                    }
                                                                } catch (e) {
                                                                    toast.error('Netzwerkfehler')
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
