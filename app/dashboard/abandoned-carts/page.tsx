'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Mail, Clock, CheckCircle, XCircle, ArrowLeft, Home, RefreshCw, ExternalLink, Bell, Volume2, VolumeX, ChevronDown, ChevronUp, Smartphone, Monitor, TrendingUp, History, Sparkles, MapPin, User, Zap, Package, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { de } from 'date-fns/locale'
import { EmailComposer } from '@/components/abandoned-carts/EmailComposer'
import { RecoverySettings } from '@/components/abandoned-carts/RecoverySettings'

interface TimelineEvent {
    type: string
    timestamp: string
    details?: {
        removedCount?: number
        cartTotal?: number
        itemsCount?: number
    }
}

interface AbandonedCart {
    id: string
    email: string
    cartUrl: string
    lineItems: any
    removedItems?: any
    totalPrice: string
    currency: string
    deviceInfo?: any
    totalPricePeak?: number | string
    isRecovered: boolean
    recoverySent: boolean
    recoverySentAt: string | null
    createdAt: string
    updatedAt: string
    // Enterprise Fields
    timeline?: TimelineEvent[]
    intentScore?: number
    recommendation?: {
        action: string
        reason: string
        delay: number
    }
    lastActiveAt?: string
}

export default function AbandonedCartsPage() {
    const router = useRouter()
    // State
    const [carts, setCarts] = useState<AbandonedCart[]>([])
    const [loading, setLoading] = useState(true)
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [timeRange, setTimeRange] = useState('7d')
    const [stats, setStats] = useState<any>(null)
    const [statsLoading, setStatsLoading] = useState(false)

    // Recovery Modals State
    const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
    const [expandedCarts, setExpandedCarts] = useState<Set<string>>(new Set())

    // Refs
    const knownCartIds = useRef<Set<string>>(new Set())
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [newCartAlert, setNewCartAlert] = useState<AbandonedCart | null>(null)

    // Hooks
    const authenticatedFetch = useAuthenticatedFetch()

    // 1. Handle Mounting & LocalStorage safely
    useEffect(() => {
        setMounted(true)
        try {
            const savedSound = localStorage.getItem('abandonedCartSoundEnabled')
            if (savedSound === 'true') {
                setSoundEnabled(true)
            }
        } catch (e) {
            console.error("LocalStorage access failed:", e)
        }
    }, [])

    // 2. Sound Toggle Logic
    const toggleSound = async () => {
        const newState = !soundEnabled
        setSoundEnabled(newState)
        try {
            localStorage.setItem('abandonedCartSoundEnabled', String(newState))
        } catch (e) {
            console.error("Failed to save sound preference:", e)
        }

        if (newState) {
            if (audioRef.current) {
                audioRef.current.load()
                const playPromise = audioRef.current.play()
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            audioRef.current?.pause()
                            audioRef.current!.currentTime = 0
                        })
                        .catch(error => console.error(`Audio unlock failed: ${error.message}`))
                }
            }

            if ('Notification' in window && Notification.permission !== 'granted') {
                try {
                    await Notification.requestPermission()
                } catch (e) { }
            }
        }
    }

    // 3. Trigger Alert Logic
    const triggerNewCartAlert = useCallback((cart: AbandonedCart, isTest: boolean = false) => {
        setNewCartAlert(cart)

        if ((soundEnabled || isTest) && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification("Neuer abgebrochener Warenkorb!", {
                    body: `Wert: ${Number(cart.totalPrice).toLocaleString('de-DE', { style: 'currency', currency: cart.currency || 'EUR' })}`,
                    icon: '/favicon.ico'
                })
            } catch (e) { }
        }

        if ((soundEnabled || isTest) && audioRef.current) {
            try {
                audioRef.current.currentTime = 0
                const playPromise = audioRef.current.play()
                if (playPromise !== undefined) {
                    playPromise.catch(e => { })
                }
            } catch (e) { }
        }

        setTimeout(() => setNewCartAlert(null), 8000)
    }, [soundEnabled])

    // Helper: Get Intent Badge
    const getIntentBadge = (score: number = 0) => {
        if (score > 60) return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 text-[10px] font-black uppercase tracking-tight">
                <Zap className="w-3 h-3 fill-orange-500" />
                Hoher Intent
            </div>
        )
        if (score > 30) return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-tight">
                <Clock className="w-3 h-3" />
                Mittel
            </div>
        )
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-tight">
                <XCircle className="w-3 h-3" />
                Gering
            </div>
        )
    }

    // Helper: Render Timeline
    const renderTimeline = (timeline: TimelineEvent[] = []) => {
        if (!timeline || !timeline.length) return <div className="text-[10px] text-gray-400 italic">Keine Historie erfasst</div>

        return (
            <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-0 before:w-[1px] before:bg-gray-100">
                {timeline.map((event, idx) => (
                    <div key={idx} className="relative">
                        <div className={`absolute -left-[19px] top-1.5 w-2 h-2 rounded-full border-2 border-white ${event.type === 'start_checkout' ? 'bg-emerald-500' :
                            event.type === 'remove_from_cart' ? 'bg-red-500' : 'bg-blue-400'
                            }`} />
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                                    {event.type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] text-gray-400 font-medium">
                                    {event.timestamp ? format(new Date(event.timestamp), 'HH:mm:ss') : '--:--:--'}
                                </span>
                            </div>
                            {event.details && (
                                <p className="text-[9px] text-gray-500 line-clamp-1">
                                    {event.details.itemsCount} Artikel • {event.details.cartTotal}€
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Helper: Get AI Recommendation
    const getRecommendationBlock = (rec: any) => {
        if (!rec) return null
        return (
            <div className="mt-3 bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">KI Empfehlung</span>
                </div>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {rec.action === 'email_soon' ? 'Sofortige E-Mail senden (Hohe Kaufabsicht)' :
                        rec.action === 'email_discount' ? 'Nudge mit 5% Rabatt senden' :
                            'Warten auf Interaktion'}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-amber-600/70 font-bold uppercase">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    Grund: {rec.reason}
                </div>
            </div>
        )
    }

    // 4. Fetch Carts Logic
    const fetchCarts = useCallback(async () => {
        setLoading(true)
        try {
            const response = await authenticatedFetch('/api/abandoned-carts')
            if (response.ok) {
                const data = await response.json()
                const currentCarts: AbandonedCart[] = data.carts || []

                if (knownCartIds.current.size > 0) {
                    const newCarts = currentCarts.filter((c: AbandonedCart) => !knownCartIds.current.has(c.id))
                    if (newCarts.length > 0) {
                        const sortedNewCarts = [...newCarts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        triggerNewCartAlert(sortedNewCarts[0])
                    }
                }

                knownCartIds.current = new Set(currentCarts.map((c: AbandonedCart) => c.id))
                setCarts(currentCarts)
                setLastRefreshed(new Date())
            }
        } catch (error) {
            console.error('Failed to fetch carts:', error)
        } finally {
            setLoading(false)
        }
    }, [authenticatedFetch, triggerNewCartAlert])

    const fetchStats = useCallback(async (range: string) => {
        setStatsLoading(true)
        try {
            const response = await authenticatedFetch(`/api/abandoned-carts/stats?range=${range}`)
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
            }
        } catch (e) {
            console.error("Failed to fetch stats:", e)
        } finally {
            setStatsLoading(false)
        }
    }, [authenticatedFetch])

    // 5. Initial Load & Interval
    useEffect(() => {
        if (mounted) {
            fetchCarts()
            fetchStats(timeRange)
            const interval = setInterval(() => {
                if (!document.hidden) {
                    fetchCarts()
                    fetchStats(timeRange)
                }
            }, 5000) // Relaxed from 1s to 5s for better performance
            return () => clearInterval(interval)
        }
    }, [mounted, fetchCarts, fetchStats, timeRange])

    const openComposer = (cart: AbandonedCart) => {
        setSelectedCart(cart)
        setIsEmailComposerOpen(true)
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-gray-50 p-8 relative">
            <audio ref={audioRef} preload="auto" src="https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3" />

            {/* Recovery Modals */}
            <EmailComposer
                isOpen={isEmailComposerOpen}
                onClose={() => setIsEmailComposerOpen(false)}
                cart={selectedCart}
                onSent={fetchCarts}
            />
            <RecoverySettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {newCartAlert && (
                <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-full duration-500">
                    <Card className="w-96 shadow-2xl border-l-4 border-l-emerald-500 bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-emerald-100 p-3 rounded-full animate-bounce">
                                    <ShoppingBag className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 flex items-center justify-between">
                                        Neuer Warenkorb!
                                        <span className="text-xs font-normal text-gray-500">Gerade eben</span>
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Ein Kunde hat Waren im Wert von <span className="font-bold text-emerald-600">{Number(newCartAlert.totalPrice).toLocaleString('de-DE', { style: 'currency', currency: newCartAlert.currency || 'EUR' })}</span> zurückgelassen.
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setNewCartAlert(null)}>Ausblenden</Button>
                                        <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.open(newCartAlert.cartUrl, '_blank')}>Ansehen</Button>
                                    </div>
                                </div>
                                <button onClick={() => setNewCartAlert(null)}><XCircle className="w-5 h-5 text-gray-400" /></button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-9 w-9 rounded-full border-slate-200 bg-white shadow-sm transition-all"
                            title="Zurück"
                        >
                            <ArrowLeft className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
                        </Button>
                        <Link href="/dashboard">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-full border-slate-200 bg-white shadow-sm transition-all"
                                title="Dashboard"
                            >
                                <Home className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
                            </Button>
                        </Link>
                        <div className="ml-1">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                    <ShoppingBag className="w-8 h-8 text-emerald-600" />
                                </div>
                                Warenkorb Wiederherstellung
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Timeframe Selector */}
                        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100 flex items-center">
                            {[
                                { id: 'today', label: 'Heute' },
                                { id: '7d', label: '7 Tage' },
                                { id: '30d', label: '30 Tage' },
                                { id: 'all', label: 'Alle' }
                            ].map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setTimeRange(r.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === r.id
                                        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={() => setIsSettingsOpen(true)}
                            variant="outline"
                            className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                            <Zap className="w-4 h-4" /> Automatisierung
                        </Button>
                        <Button onClick={toggleSound} variant={soundEnabled ? "default" : "outline"} className={soundEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {/* Enterprise Header Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <ShoppingBag className="w-20 h-20" />
                        </div>
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Erfasste Warenkörbe</p>
                                    <h3 className="text-3xl font-black tracking-tight">{carts.length}</h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-indigo-100 uppercase tracking-tighter">
                                <span>{stats?.totalItemsAdded || 0} Artikel</span>
                                <span className="opacity-40">•</span>
                                <span>{stats?.uniqueProductsCount || 0} Einzigartig</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Gesendete E-Mails</p>
                                    <h3 className="text-3xl font-black tracking-tight">{carts.filter(c => c.recoverySent).length}</h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Mail className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-1">Erfolgsrate</p>
                                    <h3 className="text-3xl font-black tracking-tight">
                                        {carts.length > 0 ? Math.round((carts.filter(c => c.isRecovered).length / carts.length) * 100) : 0}%
                                    </h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Potenzielle Erholung</p>
                                    <h3 className="text-3xl font-black tracking-tight">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                                            carts.reduce((acc, c) => acc + (parseFloat(c.totalPrice) || 0), 0)
                                        )}
                                    </h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm text-emerald-100">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Top Products Sidebar/Card */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="shadow-lg border-none overflow-hidden bg-white">
                            <CardHeader className="bg-gray-50/50 border-b pb-3 pt-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Top Produkte</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50">
                                    {statsLoading && !stats && (
                                        <div className="p-8 text-center text-xs text-gray-400 font-medium">Lade Daten...</div>
                                    )}
                                    {stats?.topProducts?.length === 0 && (
                                        <div className="p-8 text-center text-xs text-gray-400 font-medium italic">Keine Daten verfügbar</div>
                                    )}
                                    {stats?.topProducts?.map((prod: any, i: number) => (
                                        <div key={prod.productId} className="p-3 flex items-center gap-3 hover:bg-gray-50/80 transition-all group">
                                            <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                                                <img
                                                    src={prod.image || '/placeholder-product.png'}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] px-1 font-bold">#{i + 1}</div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-gray-800 truncate leading-tight group-hover:text-emerald-700 transition-colors">{prod.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {prod.count}x Hinzugefügt
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-16 h-16" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest mb-2">Profi-Tipp</h4>
                            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                                Kunden mit einem Intent-Score über 60 haben eine 4x höhere Wahrscheinlichkeit zu kaufen. Kontaktieren Sie diese Zuerst!
                            </p>
                        </div>
                    </div>

                    {/* Right: Carts List */}
                    <div className="lg:col-span-3">
                        <Card className="shadow-xl border-none">
                            <CardHeader className="border-b bg-gray-50/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold">Live Sitzungen</CardTitle>
                                        <CardDescription className="text-xs">Echtzeit-Einblick in das Verhalten Ihrer Kunden.</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => fetchCarts()} className="text-emerald-600 hover:text-emerald-700 h-8">
                                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Liste aktualisieren
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {carts.length === 0 ? (
                                        <div className="p-20 text-center">
                                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <ShoppingBag className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">Keine Warenkörbe gefunden</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2">Sobald Kunden Artikel in ihren Warenkorb legen oder entfernen, werden diese hier sofort angezeigt.</p>
                                        </div>
                                    ) : (
                                        carts.map((cart) => (
                                            <div key={cart.id} className="p-6 hover:bg-gray-50/50 transition-all group">
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                                    {/* Column 1: Customer & Status */}
                                                    <div className="lg:col-span-3 space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-gray-900 truncate mb-0.5">
                                                                    {cart.email.includes('anonymous-') ? 'Gast-Besucher' : cart.email}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">ID: {cart.id.split('-')[0]}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                                                Status & Intent
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {getIntentBadge(cart.intentScore)}
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                                                                    {cart.deviceInfo?.device === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                                                                    {cart.deviceInfo?.device || 'Desktop'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-2">
                                                            <Button
                                                                onClick={() => openComposer(cart)}
                                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                                                                size="sm"
                                                            >
                                                                <Mail className="w-3.5 h-3.5 mr-2" /> E-Mail senden
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Spacer (LG only) */}
                                                    <div className="lg:col-span-1 border-r border-gray-100 hidden lg:block" />

                                                    {/* Column 2: Cart Content */}
                                                    <div className="lg:col-span-4 space-y-6">
                                                        <div>
                                                            <div className="flex items-baseline gap-2 mb-1">
                                                                <span className="text-2xl font-black text-gray-900">
                                                                    {Number(cart.totalPrice).toLocaleString('de-DE', { style: 'currency', currency: cart.currency })}
                                                                </span>
                                                                {cart.totalPricePeak && Number(cart.totalPricePeak) > Number(cart.totalPrice) && (
                                                                    <span className="text-[10px] text-gray-400 font-bold line-through">
                                                                        {Number(cart.totalPricePeak).toLocaleString('de-DE', { style: 'currency', currency: cart.currency })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-0.5">Aktueller Warenwert</p>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {/* Current Items */}
                                                            <div>
                                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <ShoppingBag className="w-3 h-3" /> Aktuelle Artikel ({(cart.lineItems as any[])?.length || 0})
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {(cart.lineItems as any[])?.map((item: any, i: number) => (
                                                                        <div key={i} className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                                                <img src={item.image || '/placeholder-product.png'} alt="" className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">{item.title}</p>
                                                                                <p className="text-[9px] text-gray-500">Menge: {item.quantity} • {item.price}€</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Removed Items */}
                                                            {Array.isArray(cart.removedItems) && (cart.removedItems as any[]).length > 0 && (
                                                                <div className="pt-4 border-t border-gray-100">
                                                                    <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                        <XCircle className="w-3 h-3" /> Entfernte Artikel ({(cart.removedItems as any[]).length})
                                                                    </div>
                                                                    <div className="space-y-2 opacity-60">
                                                                        {(cart.removedItems as any[]).slice().reverse().map((item: any, i: number) => (
                                                                            <div key={i} className="flex items-center gap-3 line-through">
                                                                                <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 grayscale">
                                                                                    <img src={item.image || '/placeholder-product.png'} alt="" className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[11px] font-medium text-gray-500 truncate leading-tight">{item.title}</p>
                                                                                    <p className="text-[9px] text-gray-400">Entfernt um {item.removedAt ? format(new Date(item.removedAt), 'HH:mm') : 'Unbekannt'}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Column 3: Insights & Timeline */}
                                                    <div className="lg:col-span-1 border-r border-gray-100 hidden lg:block" />

                                                    <div className="lg:col-span-3 space-y-4">
                                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                                            <History className="w-3 h-3" /> Timeline & Insights
                                                        </div>

                                                        {/* AI Recommendation */}
                                                        {getRecommendationBlock(cart.recommendation)}

                                                        {/* Timeline */}
                                                        <div className="mt-4 max-h-[120px] overflow-y-auto scrollbar-hide">
                                                            {renderTimeline(cart.timeline)}
                                                        </div>

                                                        <div className="pt-4 flex items-center gap-4 text-[9px] text-gray-400 font-bold uppercase tracking-tighter border-t border-gray-100">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(cart.updatedAt), { addSuffix: true, locale: de })}
                                                            </div>
                                                            {cart.deviceInfo?.location?.city && (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" /> {cart.deviceInfo.location.city}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
