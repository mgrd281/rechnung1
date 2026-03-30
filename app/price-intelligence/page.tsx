'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, TrendingDown, TrendingUp, Minus, RefreshCw, Trash2, Plus, ExternalLink, AlertTriangle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface Competitor {
    name: string
    price: number
    url: string
    logo?: string
}

interface ProductPriceData {
    id: string
    name: string
    myPrice: number
    competitors: Competitor[]
    suggestion: {
        action: 'increase' | 'decrease' | 'hold'
        suggestedPrice: number
        reason: string
    }
}

export default function PriceIntelligencePage() {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<ProductPriceData[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: '',
        myPrice: '',
        idealoUrl: '',
        billigerUrl: '',
        sd24Url: '',
        bsUrl: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/price-intelligence')
            const json = await res.json()
            if (json.success) {
                setProducts(json.data)
            }
        } catch (error) {
            console.error('Failed to fetch price data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProduct = async () => {
        try {
            const res = await fetch('/api/price-intelligence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            })
            if (res.ok) {
                setIsAddOpen(false)
                setNewProduct({ name: '', myPrice: '', idealoUrl: '', billigerUrl: '', sd24Url: '', bsUrl: '' })
                fetchData()
            }
        } catch (error) {
            console.error('Failed to add product', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie dieses Produkt wirklich aus der Überwachung entfernen?')) return
        try {
            const res = await fetch(`/api/price-intelligence?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Failed to delete', error)
        }
    }

    const formatCurrency = (amount: number) => {
        if (!amount) return '-'
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    const getLogoColor = (logo: string) => {
        switch (logo) {
            case 'idealo': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'billiger': return 'bg-green-100 text-green-700 border-green-200'
            case 'sd24': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'bs': return 'bg-purple-100 text-purple-700 border-purple-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="mx-1" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Price Intelligence</h1>
                            <p className="text-gray-500">Wettbewerbsanalyse & Preisoptimierung</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Produkt hinzufügen
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Neues Produkt überwachen</DialogTitle>
                                    <DialogDescription>
                                        Fügen Sie ein Produkt und die Links zu den Vergleichsseiten hinzu.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Produktname</Label>
                                        <Input
                                            value={newProduct.name}
                                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="z.B. Windows 11 Pro"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Mein Preis (€)</Label>
                                        <Input
                                            type="number"
                                            value={newProduct.myPrice}
                                            onChange={e => setNewProduct({ ...newProduct, myPrice: e.target.value })}
                                            className="col-span-3"
                                            placeholder="14.99"
                                        />
                                    </div>
                                    <div className="border-t my-2"></div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Idealo Link</Label>
                                        <Input
                                            value={newProduct.idealoUrl}
                                            onChange={e => setNewProduct({ ...newProduct, idealoUrl: e.target.value })}
                                            className="col-span-3"
                                            placeholder="https://idealo.de/..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Billiger.de Link</Label>
                                        <Input
                                            value={newProduct.billigerUrl}
                                            onChange={e => setNewProduct({ ...newProduct, billigerUrl: e.target.value })}
                                            className="col-span-3"
                                            placeholder="https://billiger.de/..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">SoftwareDeals24</Label>
                                        <Input
                                            value={newProduct.sd24Url}
                                            onChange={e => setNewProduct({ ...newProduct, sd24Url: e.target.value })}
                                            className="col-span-3"
                                            placeholder="https://softwaredeals24.de/..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Best-Software</Label>
                                        <Input
                                            value={newProduct.bsUrl}
                                            onChange={e => setNewProduct({ ...newProduct, bsUrl: e.target.value })}
                                            className="col-span-3"
                                            placeholder="https://best-software.de/..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddProduct}>Speichern & Analysieren</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={fetchData} disabled={loading} variant="outline">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Aktualisieren
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">Laden...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {products.map((product) => {
                            // Find cheapest competitor
                            const validCompetitors = product.competitors.filter(c => c.price > 0)
                            const minPrice = validCompetitors.length > 0 ? Math.min(...validCompetitors.map(c => c.price)) : 0
                            const cheapestCompetitor = validCompetitors.find(c => c.price === minPrice)

                            return (
                                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                                    <CardHeader className="bg-white border-b pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 rounded-lg">
                                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">{product.name}</CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-gray-500">Mein Preis:</span>
                                                        <span className="font-bold text-lg text-gray-900">{formatCurrency(product.myPrice)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-red-600"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {/* Price Comparison Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 text-gray-500 border-b">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-medium">Anbieter</th>
                                                        <th className="px-6 py-3 text-right font-medium">Preis</th>
                                                        <th className="px-6 py-3 text-right font-medium">Status</th>
                                                        <th className="px-6 py-3 text-right font-medium">Link</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {product.competitors.map((comp, idx) => {
                                                        const isCheapest = comp.price === minPrice && comp.price > 0
                                                        const isMoreExpensive = comp.price > product.myPrice

                                                        if (comp.price === 0) return null // Skip empty

                                                        return (
                                                            <tr key={idx} className={`hover:bg-gray-50 transition-colors ${isCheapest ? 'bg-green-50/50' : ''}`}>
                                                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getLogoColor(comp.logo || '')}`}>
                                                                        {comp.name}
                                                                    </span>
                                                                    {isCheapest && (
                                                                        <span className="flex items-center text-green-600 text-xs font-bold">
                                                                            <TrendingDown className="w-3 h-3 mr-1" />
                                                                            Bester Preis
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                                    {formatCurrency(comp.price)}
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${comp.price < product.myPrice
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                        {comp.price < product.myPrice
                                                                            ? `-${formatCurrency(product.myPrice - comp.price)}`
                                                                            : `+${formatCurrency(comp.price - product.myPrice)}`
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {comp.url && (
                                                                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                                                                            Zum Shop <ExternalLink className="w-3 h-3 ml-1" />
                                                                        </a>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Recommendation Footer */}
                                        <div className="bg-gray-50 p-4 border-t flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${product.suggestion.action === 'decrease' ? 'bg-red-100 text-red-600' :
                                                    product.suggestion.action === 'increase' ? 'bg-green-100 text-green-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {product.suggestion.action === 'decrease' ? <TrendingDown className="w-5 h-5" /> :
                                                        product.suggestion.action === 'increase' ? <TrendingUp className="w-5 h-5" /> :
                                                            <Minus className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Empfehlung: {
                                                        product.suggestion.action === 'decrease' ? 'Preis senken' :
                                                            product.suggestion.action === 'increase' ? 'Preis erhöhen' :
                                                                'Preis halten'
                                                    }</p>
                                                    <p className="text-xs text-gray-500">{product.suggestion.reason}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Vorschlag</p>
                                                <p className="text-lg font-bold text-gray-900">{formatCurrency(product.suggestion.suggestedPrice)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
