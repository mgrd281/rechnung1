'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Users,
  Upload,
  TrendingUp,
  Settings,
  ShoppingBag,
  Plus,
  LogOut,
  Euro,
  Calendar,
  CheckCircle,
  Calculator,
  MessageSquare,
  Bot,
  Key,
  DollarSign,
  AlertCircle,
  Shield,
  Package,
  Gift,
  Globe,
  Star,
  RotateCcw,
  Lock,
  UserX
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DEFAULT_FEATURES } from './features-data'
import { useAuth } from '@/hooks/use-auth-compat'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ProtectedRoute } from '@/components/protected-route'
import { EnterpriseHeader } from '@/components/layout/enterprise-header'

interface DashboardStats {
  totalRevenue: number
  totalInvoices: number
  totalCustomers: number
  paidInvoicesCount: number
  paidInvoicesAmount: number
  openInvoicesCount: number
  openInvoicesAmount: number
  overdueInvoicesCount: number
  overdueInvoicesAmount: number
  refundInvoicesCount: number
  refundInvoicesAmount: number
  cancelledInvoicesCount: number
  cancelledInvoicesAmount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()
  const authenticatedFetch = useAuthenticatedFetch()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    paidInvoicesCount: 0,
    paidInvoicesAmount: 0,
    openInvoicesCount: 0,
    openInvoicesAmount: 0,
    overdueInvoicesCount: 0,
    overdueInvoicesAmount: 0,
    refundInvoicesCount: 0,
    refundInvoicesAmount: 0,
    cancelledInvoicesCount: 0,
    cancelledInvoicesAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [featuresLoading, setFeaturesLoading] = useState(true)
  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const loadFeatureOrder = async () => {
      if (!isAuthenticated || !user) {
        setFeaturesLoading(false)
        return
      }
      try {
        const response = await authenticatedFetch('/api/user/feature-order')
        if (response.ok) {
          const data = await response.json()
          if (data.featureOrder && Array.isArray(data.featureOrder)) {
            const savedOrder = data.featureOrder
            const reordered = [...DEFAULT_FEATURES].sort((a, b) => {
              const indexA = savedOrder.indexOf(a.id)
              const indexB = savedOrder.indexOf(b.id)
              if (indexA !== -1 && indexB !== -1) return indexA - indexB
              if (indexA !== -1) return -1
              if (indexB !== -1) return 1
              return 0
            })
            setFeatures(reordered)
          }
        }
      } catch (error) {
        console.error('Error loading feature order:', error)
      } finally {
        setFeaturesLoading(false)
      }
    }
    loadFeatureOrder()
  }, [isAuthenticated, user, authenticatedFetch])

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setFeatures((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)

        // Save new order
        const newOrder = newItems.map(item => item.id)
        authenticatedFetch('/api/user/feature-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureOrder: newOrder })
        }).catch(err => console.error('Failed to save order:', err))

        return newItems
      })
    }
  }

  const resetOrder = async () => {
    setFeatures(DEFAULT_FEATURES)
    try {
      await authenticatedFetch('/api/user/feature-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureOrder: DEFAULT_FEATURES.map(f => f.id) })
      })
    } catch (error) {
      console.error('Failed to reset order:', error)
    }
  }

  // Memoize the data loading function to prevent infinite loops
  const loadDashboardData = useCallback(async () => {
    try {
      console.log('📊 Loading dashboard data from API...')

      // Use authenticated fetch so the API can filter by current user/admin
      const response = await authenticatedFetch('/api/dashboard-stats')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📦 API Response:', result)

      if (result.success && result.data) {
        console.log('✅ Dashboard data loaded successfully:', result.data)
        setStats(result.data)
      } else {
        console.warn('⚠️ API returned no data:', result)
        // Keep default values if no data available
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error)
      // Keep default values on error
    } finally {
      setLoading(false)
    }
  }, [authenticatedFetch])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated && user) {
      loadDashboardData()

      // Set up auto-refresh interval (every 30 seconds)
      const interval = setInterval(() => {
        console.log('🔄 Dashboard Auto-Refresh...')
        loadDashboardData()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, authLoading, router, user, loadDashboardData])



  if (loading || authLoading || featuresLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="pb-[44px] sm:pb-[56px]">
          <EnterpriseHeader />
        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Beautiful Small Background Orbs */}
          <div className="absolute top-10 right-10 interactive-orb orb-3" title="Kleine Statistik Perle"></div>
          <div className="absolute top-32 left-8 interactive-orb orb-mini" title="Daten Perle"></div>
          <div className="absolute bottom-20 right-16 interactive-orb orb-5" title="Rosa Perle"></div>
          <div className="absolute bottom-40 left-12 interactive-orb orb-tiny" title="Winzige Info Perle"></div>
          <div className="absolute top-60 right-32 interactive-orb orb-mini" title="Elegante Perle"></div>
          <div className="absolute bottom-60 left-32 interactive-orb orb-tiny" title="Kleine Perle"></div>

          {/* Supporting Particles */}
          <div className="absolute top-16 right-32 particle particle-1"></div>
          <div className="absolute top-48 left-24 particle particle-2"></div>
          <div className="absolute bottom-32 right-40 particle particle-3"></div>
          <div className="absolute bottom-16 left-40 particle particle-4"></div>

          {/* Welcome Section */}
          <div className="mb-8 relative z-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              Willkommen zurück{user ? `, ${user.firstName}` : ''}!
              {user?.isAdmin && (
                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full border border-red-200">
                  ADMIN
                </span>
              )}
              <div className="flex items-center gap-1.5 ml-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                LIVE
              </div>
            </h2>
            <p className="text-gray-600">
              {user?.isAdmin
                ? 'Admin-Dashboard: Sie können alle Daten im System verwalten.'
                : 'Hier ist eine Übersicht über Ihre Rechnungen und Geschäftstätigkeiten.'
              }
            </p>

            {/* Error Message */}
            {stats.totalInvoices === 0 && !loading && (
              <div className="mt-2 text-xs text-gray-500">
                Hinweis: Falls keine Daten erscheinen, klicken Sie auf "Aktualisieren".
              </div>
            )}

            {/* Data Source Info */}
            {stats.totalInvoices > 0 ? (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Echte Daten geladen: {stats.totalInvoices} Rechnungen, {stats.totalCustomers} Kunden
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Keine Daten vorhanden. Importieren Sie CSV-Dateien oder erstellen Sie Rechnungen.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </div>
                <p className="text-xs text-gray-600">
                  {stats.totalRevenue > 0
                    ? `Aus ${stats.totalInvoices} Rechnungen generiert`
                    : 'Keine Umsätze vorhanden'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bezahlter Umsatz</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {stats.paidInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </div>
                <p className="text-xs text-gray-600">
                  Nur vollständig bezahlte Rechnungen (ohne Stornos)
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rechnungen gesamt</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalInvoices}</div>
                <p className="text-xs text-gray-600">
                  {stats.totalInvoices > 0
                    ? `${stats.paidInvoicesCount} bezahlt, ${stats.openInvoicesCount} offen`
                    : 'Keine Rechnungen vorhanden'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bezahlt</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.paidInvoicesCount}</div>
                <p className="text-xs text-gray-600">
                  {stats.totalInvoices > 0 ? Math.round((stats.paidInvoicesCount / stats.totalInvoices) * 100) : 0}% aller Rechnungen
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offen</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.openInvoicesCount}</div>
                <p className="text-xs text-gray-600">
                  {stats.openInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € ausstehend
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storniert</CardTitle>
                <RotateCcw className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelledInvoicesCount}</div>
                <p className="text-xs text-gray-600">
                  {stats.cancelledInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € storniert
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/invoices/new">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
                  <CardContent className="flex items-center p-6">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Neue Rechnung</h4>
                      <p className="text-sm text-gray-600">Rechnung erstellen</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/invoices">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
                  <CardContent className="flex items-center p-6">
                    <div className="bg-green-100 p-3 rounded-lg mr-4">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Alle Rechnungen</h4>
                      <p className="text-sm text-gray-600">Übersicht anzeigen</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/customers">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
                  <CardContent className="flex items-center p-6">
                    <div className="bg-purple-100 p-3 rounded-lg mr-4">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Kunden</h4>
                      <p className="text-sm text-gray-600">Verwalten</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alle Funktionen</h3>
              <Button variant="ghost" size="sm" onClick={resetOrder} className="text-gray-500 hover:text-gray-900">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={features.map(f => f.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature) => (
                    <SortableFeature key={feature.id} feature={feature} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null} zIndex={100} style={{ pointerEvents: 'none' }}>
                {activeId ? (
                  <SortableFeature feature={features.find(f => f.id === activeId)!} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>


          {/* Admin Section */}
          {user?.isAdmin && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Administration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin" className="h-full">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-red-100 bg-red-50 h-full flex flex-col">
                    <CardHeader className="flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">Benutzerverwaltung</CardTitle>
                      <CardDescription>
                        Alle Benutzer und Berechtigungen verwalten
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/blocked-users" className="h-full">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-rose-100 bg-rose-50 h-full flex flex-col">
                    <CardHeader className="flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-rose-600 to-red-700 rounded-xl flex items-center justify-center mb-4">
                        <UserX className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">Blockierte Benutzer</CardTitle>
                      <CardDescription>
                        Missbrauch verhindern und Blacklist verwalten
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dashboard/security" className="h-full">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200 bg-slate-50 h-full flex flex-col">
                    <CardHeader className="flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">IP-Sperren</CardTitle>
                      <CardDescription>
                        Store-Zugriff für bestimmte IP-Adressen blockieren
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Statistiken</CardTitle>
              <CardDescription>
                Detaillierte Aufschlüsselung Ihrer Rechnungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.paidInvoicesCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover-lift">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-sm animate-slide-in">{stats.paidInvoicesCount} bezahlte Rechnungen</span>
                    </div>
                    <span className="text-sm font-medium text-green-600 calculator-display">
                      {stats.paidInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                )}
                {stats.openInvoicesCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover-lift">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 animate-bounce"></div>
                      <span className="text-sm animate-slide-in">{stats.openInvoicesCount} offene Rechnungen</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600 status-badge-pending">
                      {stats.openInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                )}
                {stats.overdueInvoicesCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover-lift animate-glow">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-sm animate-slide-in">{stats.overdueInvoicesCount} überfällige Rechnungen</span>
                    </div>
                    <span className="text-sm font-medium text-red-600 status-badge-overdue">
                      {stats.overdueInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                )}
                {stats.refundInvoicesCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover-lift relative">
                    <div className="absolute top-1 right-1 text-xs animate-invoice-stamp">↩️</div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-float"></div>
                      <span className="text-sm animate-slide-in">{stats.refundInvoicesCount} erstattete Rechnungen</span>
                    </div>
                    <span className="text-sm font-medium text-purple-600 calculator-display">
                      {stats.refundInvoicesAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                )}
                {stats.totalInvoices === 0 && (
                  <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg hover-lift">
                    <div className="text-center">
                      <div className="relative">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-float" />
                        <div className="absolute -top-1 -right-1 invoice-paper animate-paper-fly animation-delay-1s opacity-30"></div>
                      </div>
                      <span className="text-sm text-gray-500 animate-slide-in">Keine Rechnungen vorhanden</span>
                      <div className="mt-2 text-xs text-gray-400">
                        <span className="euro-symbol">€</span> Erstellen Sie Ihre erste Rechnung!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div >
    </ProtectedRoute >
  )
}

function SortableFeature({ feature }: { feature: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: feature.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.05 : 1,
  }

  const Icon = feature.icon

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full touch-none select-none">
      <Link href={feature.href} onClick={(e) => {
        // Prevent navigation if we are dragging or if the drag just finished
        if (isDragging) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}>
        <Card className={`${feature.cardClass} h-full`}>
          <CardHeader>
            <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4 relative ${feature.iconShadow || ''}`}>
              <Icon className={`h-6 w-6 ${feature.iconColor || 'text-white'}`} />
              {feature.hasPing && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${feature.pingColor} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${feature.pingDotColor}`}></span>
                </span>
              )}
            </div>
            <CardTitle className="text-xl flex items-center gap-2">
              {feature.title}
              {feature.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${feature.badgeClass}`}>{feature.badge}</span>
              )}
            </CardTitle>
            <CardDescription>
              {feature.description}
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  )
}
