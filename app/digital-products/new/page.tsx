'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { BackButton } from '@/components/navigation/back-button'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card' // Removed
import { ArrowLeft, Search, Check, Loader2, ShoppingBag } from 'lucide-react'

interface ShopifyProduct {
    id: number
    title: string
    vendor?: string
    product_type?: string
    image?: { src: string }
    images?: { src: string }[]
    variants?: { id: number, title: string }[]
}

export default function NewDigitalProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<ShopifyProduct[]>([])
    const [existingProductIds, setExistingProductIds] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')

    // Selection state
    const [selectedProducts, setSelectedProducts] = useState<number[]>([])
    const [isActivating, setIsActivating] = useState(false)

    useEffect(() => {
        fetchShopifyProducts()
        fetchExistingDigitalProducts()
    }, [])

    const fetchExistingDigitalProducts = async () => {
        try {
            const res = await fetch('/api/digital-products')
            const data = await res.json()
            if (data.success) {
                const ids = new Set(data.data.map((p: any) => p.shopifyProductId))
                setExistingProductIds(ids as Set<string>)
            }
        } catch (error) {
            console.error('Failed to load existing digital products', error)
        }
    }

    const fetchShopifyProducts = async () => {
        try {
            const res = await fetch('/api/shopify/products')
            const data = await res.json()
            if (data.success) {
                setProducts(data.data)
            }
        } catch (error) {
            console.error('Failed to load products', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleProduct = (id: number) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts(filteredProducts.map(p => p.id))
        }
    }

    const handleBulkActivate = async () => {
        if (selectedProducts.length === 0) return

        setIsActivating(true)
        let successCount = 0
        let errorCount = 0

        try {
            for (const productId of selectedProducts) {
                const product = products.find(p => p.id === productId)
                if (!product) continue

                try {
                    const res = await fetch('/api/digital-products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: product.title,
                            shopifyProductId: String(product.id),
                            organizationId: 'default-org-id'
                        })
                    })

                    if (res.ok) {
                        successCount++
                    } else {
                        errorCount++
                    }
                } catch (e: any) {
                    console.error('Request failed:', e)
                    errorCount++
                }
            }

            if (successCount > 0) {
                await fetchExistingDigitalProducts()
                setSelectedProducts([])
                if (errorCount === 0) {
                    router.push('/digital-products')
                } else {
                    alert(`${successCount} Produkte aktiviert. ${errorCount} Fehler aufgetreten.`)
                }
            } else {
                alert('Fehler beim Aktivieren der Produkte.')
            }

        } catch (error) {
            console.error(error)
            alert('Ein Fehler ist aufgetreten')
        } finally {
            setIsActivating(false)
        }
    }

    const filteredProducts = products
        .filter(p => !existingProductIds.has(String(p.id)))
        .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))

    // Group items by Vendor
    const productsByVendor = filteredProducts.reduce((acc, product) => {
        const vendor = product.vendor || 'Andere'
        if (!acc[vendor]) {
            acc[vendor] = []
        }
        acc[vendor].push(product)
        return acc
    }, {} as Record<string, ShopifyProduct[]>)

    const sortedVendors = Object.keys(productsByVendor).sort()

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <HeaderNavIcons />
                    <h1 className="text-xl font-bold text-gray-900">Digitales Produkt hinzufügen</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold mb-2">Wählen Sie Produkte aus Ihrem Shop</h2>
                        <p className="text-gray-500 mb-6">
                            Diese Produkte werden automatisch importiert. Wählen Sie die Produkte aus, die Sie als Digitalprodukte verkaufen möchten.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Produkt suchen..."
                                    className="pl-10"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            {filteredProducts.length > 0 && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button variant="outline" onClick={toggleAll} className="w-full sm:w-auto">
                                        {selectedProducts.length === filteredProducts.length ? 'Alle abwählen' : 'Alle auswählen'}
                                    </Button>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                        disabled={selectedProducts.length === 0 || isActivating}
                                        onClick={handleBulkActivate}
                                    >
                                        {isActivating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Aktivieren...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                {selectedProducts.length > 0 ? `${selectedProducts.length} Aktivieren` : 'Aktivieren'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto bg-gray-50/50">
                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    {search ? 'Keine Produkte gefunden.' : 'Alle Produkte sind bereits aktiviert.'}
                                </div>
                            ) : (
                                sortedVendors.map(vendor => (
                                    <div key={vendor} className="mb-0">
                                        <div className="bg-gray-100/80 px-4 py-2 border-y border-gray-200 font-semibold text-sm text-gray-700 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                                            {vendor}
                                        </div>
                                        <div className="bg-white divide-y border-b">
                                            {productsByVendor[vendor].map(product => {
                                                const imgSrc = product.image?.src || product.images?.[0]?.src
                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer ${selectedProducts.includes(product.id) ? 'bg-blue-50/50' : ''}`}
                                                        onClick={() => toggleProduct(product.id)}
                                                    >
                                                        <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                checked={selectedProducts.includes(product.id)}
                                                                onChange={() => toggleProduct(product.id)}
                                                            />
                                                        </div>

                                                        <div className="h-12 w-12 bg-white rounded-lg mr-4 overflow-hidden flex-shrink-0 border flex items-center justify-center">
                                                            {imgSrc ? (
                                                                <img src={imgSrc} alt="" className="h-full w-full object-contain p-1" />
                                                            ) : (
                                                                <ShoppingBag className="w-5 h-5 text-gray-300" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-gray-900 truncate" title={product.title}>
                                                                {product.title}
                                                            </h3>
                                                            <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {product.id}</p>
                                                        </div>

                                                        <div className="ml-4">
                                                            {selectedProducts.includes(product.id) && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Ausgewählt
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
