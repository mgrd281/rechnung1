'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { BackButton } from '@/components/navigation/back-button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Package,
    Search,
    Key,
    Settings,
    Loader2,
    ArrowRight,
    PlusCircle,
    CheckCircle2,
    BarChart,
    ShoppingBag,
    ArrowLeft,
    Home,
    Zap,
    Trash2,
    AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { ImportSuccessBanner } from '@/components/ui/import-success-banner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter as AlertDialogFooterUI,
} from "@/components/ui/alert-dialog"

interface ShopifyProduct {
    id: number
    title: string
    vendor?: string
    product_type?: string
    image?: { src: string }
    images?: { src: string }[]
}

interface DigitalProductData {
    id: string
    title: string
    shopifyProductId: string
    image?: string | null
    _count: {
        keys: number
    }
}

export default function DigitalProductsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([])
    const [digitalProducts, setDigitalProducts] = useState<Map<string, DigitalProductData>>(new Map())
    const [search, setSearch] = useState('')
    const [activatingId, setActivatingId] = useState<number | null>(null)

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'all', id?: string, shopifyId?: string } | null>(null)
    const { data: session } = useSession()
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                // Parallel fetch
                const [shopifyRes, digitalRes] = await Promise.all([
                    fetch('/api/shopify/products'),
                    fetch('/api/digital-products')
                ])

                const shopifyData = await shopifyRes.json()
                const digitalData = await digitalRes.json()

                if (shopifyData.success) {
                    setShopifyProducts(shopifyData.data)
                }

                if (digitalData.success) {
                    const map = new Map<string, DigitalProductData>()
                    digitalData.data.forEach((p: DigitalProductData) => {
                        map.set(p.shopifyProductId, p)
                    })
                    setDigitalProducts(map)
                }

            } catch (error) {
                console.error('Failed to load data', error)
                toast.error('Fehler beim Laden der Produkte')
            } finally {
                setLoading(false)
            }
        }

        loadData()

        const interval = setInterval(() => {
            console.log('🔄 Digital Products Auto-Refresh...')
            loadData()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const handleActivate = async (product: ShopifyProduct) => {
        setActivatingId(product.id)
        try {
            const res = await fetch('/api/digital-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: product.title,
                    shopifyProductId: String(product.id),
                    organizationId: (session?.user as any)?.organizationId || 'default-org-id'
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success('Produkt aktiviert! Sie finden es jetzt oben bei den aktiven Produkten.')
                // Update local state - this will cause it to move to the "Active" section automatically
                const newMap = new Map(digitalProducts)
                newMap.set(String(product.id), data.data)
                setDigitalProducts(newMap)
            } else {
                toast.error('Fehler beim Aktivieren')
            }
        } catch (error) {
            console.error('Activation failed', error)
            toast.error('Netzwerkfehler')
        } finally {
            setActivatingId(null)
        }
    }

    const initiateDelete = (e: React.MouseEvent, type: 'single' | 'all', id?: string, shopifyId?: string) => {
        e.preventDefault()
        e.stopPropagation()
        setDeleteTarget({ type, id, shopifyId })
        setDeleteDialogOpen(true)
    }

    const executeDelete = async () => {
        if (!deleteTarget) return

        setIsDeleting(true)
        try {
            if (deleteTarget.type === 'single' && deleteTarget.id) {
                const res = await fetch(`/api/digital-products/${deleteTarget.id}`, {
                    method: 'DELETE'
                })

                if (res.ok) {
                    toast.success('Produkt deaktiviert')
                    const newMap = new Map(digitalProducts)
                    if (deleteTarget.shopifyId) newMap.delete(deleteTarget.shopifyId)
                    setDigitalProducts(newMap)
                } else {
                    toast.error('Fehler beim Deaktivieren')
                }
            } else if (deleteTarget.type === 'all') {
                // Bulk delete - Frontend parallel fetch implementation
                const idsToDelete = Array.from(digitalProducts.values()).map(p => p.id)
                // We do this in parallel, simpler than adding backend endpoint right now and safe for <100 products
                const promises = idsToDelete.map(id =>
                    fetch(`/api/digital-products/${id}`, { method: 'DELETE' })
                )

                await Promise.all(promises)

                toast.success('Alle Produkte wurden deaktiviert')
                setDigitalProducts(new Map()) // Clear all locally
            }
        } catch (error) {
            console.error('Failed to delete', error)
            toast.error('Fehler beim Löschen')
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setDeleteTarget(null)
        }
    }

    const isMicrosoft = (p: ShopifyProduct) => {
        const text = (p.vendor + ' ' + p.title + ' ' + p.product_type).toLowerCase()
        return text.includes('microsoft') || text.includes('windows') || text.includes('office')
    }

    // Filter Logic
    const filteredProducts = shopifyProducts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.vendor?.toLowerCase().includes(search.toLowerCase())
    )

    // Separate Active vs Inactive
    const activeProducts = filteredProducts.filter(p => digitalProducts.has(String(p.id)))
    const inactiveProducts = filteredProducts.filter(p => !digitalProducts.has(String(p.id)))

    // Sort Active Products: Microsoft first
    activeProducts.sort((a, b) => {
        const am = isMicrosoft(a)
        const bm = isMicrosoft(b)
        if (am && !bm) return -1
        if (!am && bm) return 1
        return 0
    })

    // Group Inactive Items by Vendor
    const inactiveByVendor = inactiveProducts.reduce((acc, product) => {
        const vendor = product.vendor || 'Andere'
        if (!acc[vendor]) {
            acc[vendor] = []
        }
        acc[vendor].push(product)
        return acc
    }, {} as Record<string, ShopifyProduct[]>)

    // Sort Vendors: Microsoft vendors first
    const sortedInactiveVendors = Object.keys(inactiveByVendor).sort((a, b) => {
        const am = a.toLowerCase().includes('microsoft')
        const bm = b.toLowerCase().includes('microsoft')
        if (am && !bm) return -1
        if (!am && bm) return 1
        return a.localeCompare(b)
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <ImportSuccessBanner />
            <header className="bg-white shadow-sm border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <HeaderNavIcons />
                            <div className="ml-1">
                                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    Digitale Produkte
                                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                                        <div className="w-1 px-1 h-1 bg-emerald-500 rounded-full"></div>
                                        LIVE
                                    </div>
                                </h1>
                                <p className="text-xs text-gray-500">Verwalten Sie Ihre Lizenzschlüssel und Downloads</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1 md:justify-end min-w-0">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Suche nach Produkt oder Marke..."
                                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" onClick={() => router.push('/digital-products/reports')} className="hidden sm:flex">
                                <BarChart className="w-4 h-4 mr-2" />
                                Berichte
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500">Lade Produkte aus Ihrem Shop...</p>
                    </div>
                ) : (
                    <>
                        {/* SECTION 1: ACTIVATED PRODUCTS */}
                        {activeProducts.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <h2 className="text-lg font-bold text-gray-900">Aktive Produkte</h2>
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {activeProducts.length}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => initiateDelete(e, 'all')}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs uppercase font-bold tracking-wider"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Alle entfernen
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {activeProducts.map(product => {
                                        const digitalData = digitalProducts.get(String(product.id))!
                                        const keyCount = digitalData._count.keys
                                        const imgSrc = product.image?.src || product.images?.[0]?.src
                                        const isMicrosoftProd = isMicrosoft(product)

                                        return (
                                            <div
                                                key={product.id}
                                                className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all relative group ${isMicrosoftProd ? 'border-blue-100 ring-1 ring-blue-50' : 'border-gray-200'}`}
                                            >
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={(e) => initiateDelete(e, 'single', digitalData.id, String(product.id))}
                                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        title="Produkt entfernen"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="p-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-16 w-16 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {imgSrc ? (
                                                                <img src={imgSrc} alt="" className="w-full h-full object-contain p-1" />
                                                            ) : (
                                                                <ShoppingBag className="w-6 h-6 text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight" title={product.title}>
                                                                {product.title}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 font-mono mt-1">ID: {product.id}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${keyCount > 0
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            }`}>
                                                            {keyCount} Keys verfügbar
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => router.push(`/digital-products/${digitalData.id}`)}
                                                            className="h-8 bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            Verwalten
                                                            <ArrowRight className="w-3 h-3 ml-1.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SECTION 2: INACTIVE PRODUCTS */}
                        <div className="space-y-6">
                            {activeProducts.length > 0 && inactiveProducts.length > 0 && (
                                <div className="flex items-center gap-2 pt-8 pb-2 border-b border-gray-200">
                                    <Package className="w-5 h-5 text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-600">Noch nicht aktiviert</h2>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {inactiveProducts.length}
                                    </span>
                                </div>
                            )}

                            {activeProducts.length === 0 && inactiveProducts.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Keine Produkte gefunden.</p>
                                </div>
                            )}

                            {sortedInactiveVendors.map(vendor => (
                                <div key={vendor} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center sticky top-0">
                                        <h2 className="font-bold text-gray-800 uppercase tracking-wide text-sm flex items-center gap-2">
                                            {vendor}
                                        </h2>
                                        <span className="text-xs font-mono text-gray-400">
                                            {inactiveByVendor[vendor].length} Produkte
                                        </span>
                                    </div>

                                    <div className="divide-y divide-gray-50">
                                        {inactiveByVendor[vendor].map(product => {
                                            const imgSrc = product.image?.src || product.images?.[0]?.src

                                            return (
                                                <div
                                                    key={product.id}
                                                    className="group flex items-center p-4 hover:bg-blue-50/20 transition-colors"
                                                >
                                                    {/* Image */}
                                                    <div className="h-12 w-12 bg-white rounded-lg mr-4 overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center shadow-sm">
                                                        {imgSrc ? (
                                                            <img src={imgSrc} alt="" className="h-full w-full object-contain p-1" />
                                                        ) : (
                                                            <ShoppingBag className="w-5 h-5 text-gray-300" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <h3 className="font-medium text-gray-900 truncate opacity-90 group-hover:opacity-100" title={product.title}>
                                                            {product.title}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {product.id}</p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center shrink-0">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleActivate(product)}
                                                            disabled={activatingId === product.id}
                                                            className="text-gray-600 hover:text-blue-600 hover:border-blue-200 bg-white shadow-sm"
                                                        >
                                                            {activatingId === product.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                                            ) : (
                                                                <>
                                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                                    Aktivieren
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* DELETE CONFIRMATION DIALOG */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {deleteTarget?.type === 'all'
                                    ? 'Alle aktiven Produkte entfernen?'
                                    : 'Produkt deaktivieren?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {deleteTarget?.type === 'all'
                                    ? `Möchten Sie wirklich alle ${activeProducts.length} aktiven Produkte deaktivieren? Die Produkte werden wieder in die Liste "Noch nicht aktiviert" verschoben.`
                                    : 'Möchten Sie dieses Produkt wirklich aus den aktiven digitalen Produkten entfernen? Es wird wieder in die Liste "Noch nicht aktiviert" verschoben.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    executeDelete()
                                }}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Entfernen...
                                    </>
                                ) : (
                                    'Entfernen'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    )
}
