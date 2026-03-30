'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect, useRef, useCallback, Suspense, useMemo, memo } from 'react'
import { BackButton } from '@/components/navigation/back-button'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Download, Trash2, Plus, Search, Filter, RefreshCw, MailCheck, TriangleAlert, CircleCheck, X, CircleX, DollarSign, FileText, ArrowLeft, Mail, Check, ArrowDown, Pencil, Edit, Save, Calculator, Bell, OctagonAlert, CircleAlert, Send, Volume2, VolumeX, ShieldAlert, UserX, UserCheck, Archive, ChevronDown, MoreHorizontal, FileSpreadsheet, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Sparkles, Zap } from 'lucide-react'
import { InvoiceActions } from '@/components/invoice-actions'
import { EmailInvoice } from '@/components/email-invoice'
import BulkEmailSender from '@/components/bulk-email-sender'
import CSVExportButton from '@/components/csv-export-button'
import DocxExportButton from '@/components/docx-export-button'
import ExcelExportButton from '@/components/excel-export-button'
import { CustomerHistoryDrawer } from '@/components/customer-history-drawer'
import { InvoiceType, ExtendedInvoice } from '@/lib/invoice-types'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { BarChart3, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-compat'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ImportSuccessBanner } from '@/components/ui/import-success-banner'

function getPaymentMethodDisplay(method: string | undefined) {
  if (!method) return <span className="text-gray-400">-</span>

  let label = method
  let className = "bg-gray-100 text-gray-800"

  const lowerMethod = method.toLowerCase()

  if (lowerMethod.includes('paypal')) {
    label = 'PayPal'
    className = "bg-[#003087]/10 text-[#003087]"
  } else if (lowerMethod.includes('credit') || lowerMethod.includes('kredit')) {
    label = 'Kreditkarte'
    className = "bg-purple-100 text-purple-800"
  } else if (lowerMethod.includes('klarna')) {
    label = 'Klarna'
    className = "bg-pink-100 text-pink-800"
  } else if (lowerMethod.includes('sofort')) {
    label = 'Sofort'
    className = "bg-orange-100 text-orange-800"
  } else if (lowerMethod.includes('amazon')) {
    label = 'Amazon Pay'
    className = "bg-cyan-100 text-cyan-800"
  } else if (lowerMethod === 'manual' || lowerMethod === 'custom') {
    label = 'Vorkasse'
    className = "bg-yellow-100 text-yellow-800"
  } else if (lowerMethod.includes('vorkasse')) {
    label = 'Vorkasse'
    className = "bg-yellow-100 text-yellow-800"
  } else if (lowerMethod.includes('rechnung')) {
    label = 'Rechnung'
    className = "bg-yellow-100 text-yellow-800"
  } else if (lowerMethod.includes('shopify')) {
    label = 'Shopify Payments'
    className = "bg-green-100 text-green-800"
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function getGermanStatus(status: any) {
  if (!status) return ''
  const s = String(status).toUpperCase()
  switch (s) {
    case 'PAID': return 'Bezahlt'
    case 'SENT':
    case 'OPEN': return 'Offen'
    case 'DRAFT': return 'Entwurf'
    case 'OVERDUE': return 'Überfällig'
    case 'CANCELLED': return 'Storniert'
    case 'REFUND_FULL':
    case 'REFUND_PARTIAL':
    case 'CREDIT_NOTE':
    case 'REFUND': return 'Gutschrift'
    case 'PENDING': return 'Ausstehend'
    case 'BLOCKED': return 'Gesperrt'
    case 'ON_HOLD': return 'In Prüfung'
    default: return String(status)
  }
}



// Memoized Row Component to prevent full re-renders of the table during hover actions
const InvoiceRow = memo(({
  invoice,
  isHovered,
  onHover,
  isSelected,
  onSelectChange,
  isDuplicate,
  emailStatus,
  onRefresh,
  onDownload,
  onDelete,
  onSync,
  onCustomerClick,
  safeFormatDate,
  safeFormatTime,
  safeFormatCurrency,
  getPaymentMethodDisplay,
  getStatusColor,
  getGermanStatus
}: any) => {
  if (!invoice) return null;

  return (
    <TableRow
      onMouseEnter={() => onHover(invoice.id)}
      onMouseLeave={() => onHover(null)}
      className={`group transition-all hover:bg-slate-50/80 ${isDuplicate ? 'bg-orange-50/50 border-l-4 border-l-orange-400' : ''}`}
    >
      <TableCell className="w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Rechnung ${invoice.number} auswählen`}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">
              {invoice.orderNumber || (invoice.order?.shopifyOrderId ? (invoice.order.shopifyOrderId.startsWith('#') ? invoice.order.shopifyOrderId : `#${invoice.order.shopifyOrderId}`) : (invoice.order?.orderNumber || '-'))}
            </span>
            {isDuplicate && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800">
                Duplikat
              </span>
            )}
          </div>
          {invoice.number && (
            <span className="text-xs text-gray-500 font-mono" title="Rechnungsnummer">
              {invoice.number}
            </span>
          )}
          {invoice.originalInvoiceNumber && (
            <span className="text-[10px] text-gray-400">
              Ref: {invoice.originalInvoiceNumber}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex flex-col"
          onClick={() => onCustomerClick(invoice.customerEmail || invoice.customer?.email)}
        >
          <div className="flex items-center gap-2">
            <span>{invoice.customerName || invoice.customer?.name || 'Unbekannter Kunde'}</span>
            {invoice.isGuestCheckout && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Gast
              </span>
            )}
          </div>
          {(invoice.customerEmail || invoice.customer?.email) && (
            <span className="text-xs text-gray-500 no-underline font-normal">
              {invoice.customerEmail || invoice.customer?.email}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{safeFormatDate(invoice.date)}</span>
          {invoice.date && <span className="text-xs text-gray-500">{safeFormatTime(invoice.date)}</span>}
        </div>
      </TableCell>
      <TableCell className="font-medium text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-bold">
            {safeFormatCurrency(invoice.amount || invoice.total, invoice.currency)}
          </span>
          <span className="text-[10px] text-gray-500 font-normal">
            inkl. {safeFormatCurrency(invoice.taxTotal || invoice.taxAmount || ((invoice.total || 0) * 0.19 / 1.19), invoice.currency)} MwSt
          </span>
          {invoice.items && invoice.items.length > 0 && (invoice.status === 'PAID' || invoice.status === 'Bezahlt') && (
            <div
              className="text-[10px] text-blue-600/70 font-normal mt-1 max-w-[180px] truncate text-right border-t border-blue-50/50 pt-1"
              title={invoice.items.slice(0, 10).map((item: any) => item?.description || '').join(', ') + (invoice.items.length > 10 ? '...' : '')}
            >
              {invoice.items.slice(0, 2).map((item: any) => item?.description || '').join(', ')}
              {invoice.items.length > 2 && '...'}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {getPaymentMethodDisplay(invoice.paymentMethod || invoice.settings?.paymentMethod)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.documentKind && invoice.documentKind !== 'INVOICE' ? invoice.documentKind : invoice.status)}`}>
            {getGermanStatus(invoice.documentKind && invoice.documentKind !== 'INVOICE' ? invoice.documentKind : invoice.status)}
          </span>
          {emailStatus?.sent && (
            <div className="flex items-center text-green-600" title={`E-Mail gesendet am ${safeFormatDate(emailStatus.sentAt)} an ${emailStatus.sentTo}`}>
              <MailCheck className="h-4 w-4" />
              <span className="text-xs ml-1">Versendet</span>
            </div>
          )}
          {invoice.vorkasseReminderLevel > 0 && (
            <div className="flex items-center text-orange-600 ml-2" title={`Mahnstufe ${invoice.vorkasseReminderLevel} - Letzte: ${safeFormatDate(invoice.vorkasseLastReminderAt)}`}>
              <TriangleAlert className="h-4 w-4" />
              <span className="text-xs ml-1 font-medium">Mahnung {invoice.vorkasseReminderLevel}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right py-2 px-4 whitespace-nowrap min-w-[120px]">
        <div className={`flex items-center justify-end gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {isHovered && (
            <>
              <div className="flex items-center gap-1.5">
                <Link href={`/invoices/${invoice.id}`}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F4F6] transition-all active:translate-y-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" title="Ansehen">
                    <Eye className="h-[18px] w-[18px] text-slate-600" strokeWidth={1.5} />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDownload(invoice.id, invoice.number)}
                  className="h-9 w-9 rounded-lg hover:bg-[#F3F4F6] transition-all active:translate-y-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                  title="Download PDF"
                >
                  <Download className="h-[18px] w-[18px] text-slate-600" strokeWidth={1.5} />
                </Button>

                {(() => {
                  const s = invoice.status?.toUpperCase()
                  const showEmail = !['CANCELLED', 'STORNIERT', 'REFUND', 'ERSTATTET'].includes(s)
                  return showEmail && (
                    <EmailInvoice
                      invoice={invoice}
                      variant="ghost"
                      className="h-9 w-9 rounded-lg hover:bg-[#F3F4F6]"
                      onEmailSent={() => onRefresh(true)}
                    />
                  )
                })()}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F4F6] transition-all active:translate-y-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" title="Mehr Aktionen">
                    <MoreHorizontal className="h-[18px] w-[18px] text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100 p-1">
                  <InvoiceActions
                    invoice={invoice}
                    onInvoiceUpdated={() => onRefresh(true)}
                    onDelete={onDelete}
                    onSync={onSync}
                  />

                  {isDuplicate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-orange-600 focus:text-orange-700">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Duplikate löschen
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
})

InvoiceRow.displayName = 'InvoiceRow';

function InvoicesPageContent() {
  // Persistent audio reference to bypass autoplay policies
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false) // Start disabled - requires user interaction
  const [isAudioBlessed, setIsAudioBlessed] = useState(false) // Track if audio context is activated
  const [soundError, setSoundError] = useState<string>('')

  // Don't initialize audio on page load - wait for user interaction

  // Helper: Try to unlock audio context
  const unlockAudioContext = useCallback(async () => {
    try {
      // Try Web Audio API approach
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          audioContextRef.current = new AudioContext()
        }
      }

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('✅ Audio Context resumed')
      }

      return true
    } catch (e) {
      console.error('Audio Context unlock failed:', e)
      return false
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    // Only play if sound is enabled AND audio context has been blessed by user interaction
    if (!isSoundEnabled || !audioRef.current || !isAudioBlessed) {
      if (!isAudioBlessed && isSoundEnabled) {
        console.warn('⚠️ Sound enabled but audio context not blessed. User needs to click sound button first.')
      }
      return
    }

    // Reset time to allow rapid replay
    audioRef.current.currentTime = 0
    const playPromise = audioRef.current.play()

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Sound playback failed:', error)
        // If playback fails, reset blessed state
        setIsAudioBlessed(false)
        setIsSoundEnabled(false)
      })
    }
  }, [isSoundEnabled, isAudioBlessed])

  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const authenticatedFetch = useAuthenticatedFetch()
  const { navigate } = useSafeNavigation()

  // State definitions
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk', ids: string[], invoiceNumber?: string }>({ type: 'single', ids: [] })
  const [deleting, setDeleting] = useState(false)
  const [cleaningUp, setCleaningUp] = useState(false)
  const [deletingByNumber, setDeletingByNumber] = useState<string | null>(null)
  const [emailStatuses, setEmailStatuses] = useState<Record<string, any>>({})
  const [showBulkEmailSender, setShowBulkEmailSender] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [hiddenInvoices, setHiddenInvoices] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string | null>(searchParams.get('status'))
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const { showToast, removeToast } = useToast()

  // Pagination State
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '50')) // Default limit 50
  const [totalPages, setTotalPages] = useState(1)
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0)
  const [globalTotalCount, setGlobalTotalCount] = useState(0)
  const [vat19Sum, setVat19Sum] = useState(0)
  const [vat7Sum, setVat7Sum] = useState(0)
  const [totalShopifyFees, setTotalShopifyFees] = useState(0)
  const [totalPaidAmount, setTotalPaidAmount] = useState(0)
  const [totalRefundAmount, setTotalRefundAmount] = useState(0)

  // Stats Counts State
  const [paidInvoicesCount, setPaidInvoicesCount] = useState(0)
  const [openInvoicesCount, setOpenInvoicesCount] = useState(0)
  const [overdueInvoicesCount, setOverdueInvoicesCount] = useState(0)
  const [cancelledInvoicesCount, setCancelledInvoicesCount] = useState(0)
  const [refundInvoicesCount, setRefundInvoicesCount] = useState(0)

  // Dunning Automation State
  const [dunningEnabled, setDunningEnabled] = useState(false)
  const [loadingDunning, setLoadingDunning] = useState(false)

  // Fetch Dunning Settings
  const fetchDunningSettings = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/dunning/settings')
      if (res.ok) {
        const data = await res.json()
        setDunningEnabled(data.enabled || false)
      }
    } catch (error) {
      console.error('Failed to fetch dunning settings:', error)
    }
  }, [authenticatedFetch])

  const toggleDunning = async (enabled: boolean) => {
    setLoadingDunning(true)
    try {
      // First fetch current settings to avoid overwriting numbers
      const getRes = await authenticatedFetch('/api/dunning/settings')
      let currentSettings = {
        reminderDays: 7,
        warning1Days: 3,
        warning2Days: 7,
        finalWarningDays: 7,
        warning1Surcharge: 5.0,
        warning2Surcharge: 3.0,
        finalWarningSurcharge: 3.0
      }
      if (getRes.ok) {
        const data = await getRes.json()
        currentSettings = { ...currentSettings, ...data }
      }

      const res = await authenticatedFetch('/api/dunning/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentSettings, enabled })
      })

      if (res.ok) {
        setDunningEnabled(enabled)
        showToast(
          enabled ? 'Automatisches Mahnwesen AKTIVIERT' : 'Automatisches Mahnwesen DEAKTIVIERT',
          enabled ? 'success' : 'info'
        )
      } else throw new Error('Failed')
    } catch (e) {
      showToast('Fehler beim Ändern der Automatisierung', 'error')
    } finally {
      setLoadingDunning(false)
    }
  }

  useEffect(() => {
    fetchDunningSettings()
  }, [fetchDunningSettings])

  const [isAutoSyncing, setIsAutoSyncing] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Date Filter State
  const [dateRange, setDateRange] = useState<{ from: string | null, to: string | null }>(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const today = new Date().toISOString().split('T')[0]
    return { from: from || today, to: to || today }
  })



  // Bulk Actions State
  const [showBulkStatusUpdate, setShowBulkStatusUpdate] = useState(false)

  // Accountant Export
  const [showAccountantDialog, setShowAccountantDialog] = useState(false)
  const [accountantEmail, setAccountantEmail] = useState('')
  const [sendingAccountant, setSendingAccountant] = useState(false)

  // Filter states
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('')
  const [filterMinAmount, setFilterMinAmount] = useState<string>('')
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>('')
  const [filterNewCustomers, setFilterNewCustomers] = useState(false)
  const [filterUnsent, setFilterUnsent] = useState(false)
  const [filterDuplicates, setFilterDuplicates] = useState(false)

  // Customer History Drawer State
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Abort controller ref to cancel previous requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Safe date formatting helpers (memoized to prevent Row re-renders)
  const safeFormatDate = useCallback((date: any) => {
    try {
      if (!date) return '-'
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch (e) {
      return '-'
    }
  }, [])

  const safeFormatTime = useCallback((date: any) => {
    try {
      if (!date) return ''
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ''
    }
  }, [])

  const safeFormatCurrency = useCallback((amount: any, currencyCode: string = 'EUR') => {
    try {
      let safeCurrency = currencyCode || 'EUR'
      if (typeof safeCurrency !== 'string' || safeCurrency.length !== 3) safeCurrency = 'EUR'
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: safeCurrency }).format(amount || 0)
    } catch (e) {
      return `${amount || 0} €`
    }
  }, [])

  // Hydration safety
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])


  // Handle Back Button and URL Sync
  useEffect(() => {
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const pageNum = parseInt(searchParams.get('page') || '1')
    const limitNum = parseInt(searchParams.get('limit') || '50')
    const from = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]

    if (searchQuery !== search) setSearchQuery(search)
    if (statusFilter !== status) setStatusFilter(status)
    if (page !== pageNum) setPage(pageNum)
    if (limit !== limitNum) setLimit(limitNum)
    if (dateRange.from !== from || dateRange.to !== to) {
      setDateRange({ from, to })
    }
  }, [searchParams])

  // Consolidated sync state to URL
  useEffect(() => {
    if (!isMounted) return

    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (statusFilter) params.set('status', statusFilter)
    if (page > 1) params.set('page', page.toString())
    if (limit !== 50) params.set('limit', limit.toString())
    if (dateRange.from) params.set('from', dateRange.from)
    if (dateRange.to) params.set('to', dateRange.to)

    const newUrl = `${window.location.pathname}?${params.toString()}`
    const currentUrl = `${window.location.pathname}${window.location.search}`

    if (currentUrl !== newUrl) {
      // Use replace for filter/search changes to keep history clean
      // Use push only for page changes if necessary, but replace is safer for stability
      router.replace(newUrl, { scroll: false })
    }
  }, [searchQuery, statusFilter, page, limit, dateRange, isMounted, router])

  const fetchInvoices = useCallback(async (isBackground = false) => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, cannot load invoices')
      setInvoices([])
      setLoading(false)
      return
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Set timeout to avoid hanging requests (15 seconds)
    const timeoutId = setTimeout(() => {
      console.log('Fetch timed out, aborting...')
      abortController.abort()
    }, 15000)

    if (!isBackground) {
      // Only set main loading if not searching (to avoid full screen spinner on search)
      if (!isSearching) setLoading(true)
    }

    try {
      // Build query string
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (debouncedSearchQuery) {
        queryParams.append('search', debouncedSearchQuery)
        // Optimization: When searching, ignore date filter to search GLOBAL history
        // This solves the issue of having to clear date range to find old invoices
      } else {
        // Only apply date filter if NOT searching
        if (dateRange.from) queryParams.append('from', dateRange.from)
        if (dateRange.to) queryParams.append('to', dateRange.to)
      }

      if (statusFilter) {
        // Map common German labels to status keys the API/Enum understands
        let apiStatus = statusFilter;
        if (statusFilter === 'Offen') apiStatus = 'SENT';
        if (statusFilter === 'Bezahlt') apiStatus = 'PAID';
        if (statusFilter === 'Storniert') apiStatus = 'CANCELLED';
        if (statusFilter === 'Überfällig') apiStatus = 'OVERDUE';
        if (statusFilter === 'Gutschrift') apiStatus = 'REFUND';

        queryParams.append('status', apiStatus)
      }

      // Advanced Filters
      if (filterPaymentMethod && filterPaymentMethod !== 'all') queryParams.append('paymentMethod', filterPaymentMethod)
      if (filterMinAmount) queryParams.append('minAmount', filterMinAmount)
      if (filterMaxAmount) queryParams.append('maxAmount', filterMaxAmount)
      if (filterNewCustomers) queryParams.append('newCustomers', 'true')

      // Fetch invoices for this user only using authenticated fetch with pagination and search
      const response = await authenticatedFetch(`/api/invoices?${queryParams.toString()}`, {
        signal: abortController.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle new response format
      const allInvoices = data.invoices || []
      const pagination = data.pagination || { total: 0, pages: 1, page: 1, limit: 20 }

      // Set stats from API
      if (data.stats) {
        setVat19Sum(typeof data.stats.totalVat19 === 'number' ? data.stats.totalVat19 : 0)
        setVat7Sum(typeof data.stats.totalVat7 === 'number' ? data.stats.totalVat7 : 0)
        setTotalPaidAmount(typeof data.stats.totalPaidAmount === 'number' ? data.stats.totalPaidAmount : 0)
        setTotalRefundAmount(typeof data.stats.totalRefundAmount === 'number' ? data.stats.totalRefundAmount : 0)
        setTotalShopifyFees(typeof data.stats.totalShopifyFees === 'number' ? data.stats.totalShopifyFees : 0)

        // Set counts
        setPaidInvoicesCount(typeof data.stats.paidInvoicesCount === 'number' ? data.stats.paidInvoicesCount : 0)
        setOpenInvoicesCount(typeof data.stats.openInvoicesCount === 'number' ? data.stats.openInvoicesCount : 0)
        setOverdueInvoicesCount(typeof data.stats.overdueInvoicesCount === 'number' ? data.stats.overdueInvoicesCount : 0)
        setCancelledInvoicesCount(typeof data.stats.cancelledInvoicesCount === 'number' ? data.stats.cancelledInvoicesCount : 0)
        setRefundInvoicesCount(typeof data.stats.refundInvoicesCount === 'number' ? data.stats.refundInvoicesCount : 0)
      } else {
        setVat19Sum(0)
        setVat7Sum(0)
        setTotalPaidAmount(0)
        setTotalRefundAmount(0)
        setTotalShopifyFees(0)
        setPaidInvoicesCount(0)
        setOpenInvoicesCount(0)
        setOverdueInvoicesCount(0)
        setCancelledInvoicesCount(0)
        setRefundInvoicesCount(0)
      }

      setTotalPages(pagination.pages)
      setTotalInvoicesCount(pagination.total)
      if (data.stats && typeof data.stats.count === 'number') {
        setGlobalTotalCount(data.stats.count)
      }

      console.log('Fetched invoices for user:', user.email, 'Count:', allInvoices.length, 'Page:', page)

      // Extract email statuses from the invoices directly
      const emailStatusMap = allInvoices.reduce((acc: Record<string, any>, invoice: any) => {
        if (invoice.emailStatus) {
          acc[invoice.id] = invoice.emailStatus
        } else {
          acc[invoice.id] = { sent: false }
        }
        return acc
      }, {})

      setEmailStatuses(emailStatusMap)

      // Only use API data - no local mock data to avoid ID conflicts
      // The API already includes mock/test invoices
      const combinedInvoices = allInvoices

      // Sort invoices by creation date/upload date in descending order (newest first)
      // Note: Backend already sorts, but we can keep client-side sort if needed for mixed data
      const sortedInvoices = combinedInvoices.sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.createdAt || a.uploadedAt || '1970-01-01').getTime()
        const dateB = new Date(b.date || b.createdAt || b.uploadedAt || '1970-01-01').getTime()

        if (dateB !== dateA) {
          return dateB - dateA // Sort by date descending
        }

        // If dates are equal, sort by invoice number descending
        const numA = a.number || a.invoiceNumber || ''
        const numB = b.number || b.invoiceNumber || ''
        return numB.localeCompare(numA, undefined, { numeric: true, sensitivity: 'base' })
      })

      console.log('Invoices sorted by date (newest first):', sortedInvoices.length)
      setInvoices(sortedInvoices)

      // Update search results state if we are searching
      if (debouncedSearchQuery) {
        setSearchResults(sortedInvoices)
        setShowSearchResults(true)
      } else {
        setShowSearchResults(false)
      }

    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
        return
      }
      console.error('Error fetching invoices:', error)
      // Fallback to empty array - API should handle mock data
      setInvoices([])
      showToast('Fehler beim Laden der Rechnungen', 'error')
    } finally {
      // Only set loading false if this request wasn't aborted and we were loading
      if (abortControllerRef.current === abortController) {
        if (!isBackground) setLoading(false)
        setIsSearching(false) // Stop search loading indicator
      }
    }
  }, [isAuthenticated, user?.email, page, limit, debouncedSearchQuery, statusFilter, dateRange, filterPaymentMethod, filterMinAmount, filterMaxAmount, filterNewCustomers]) // Add filters to dependencies

  // Listen for invoice updates (e.g., after CSV upload)
  const handleInvoiceUpdate = useCallback(() => {
    console.log('Invoice update detected, refreshing list...')
    fetchInvoices(true) // Background update
  }, [fetchInvoices])

  // 1. Memoized duplicate detection
  const duplicateNumbers = useMemo(() => {
    const numberCounts: { [key: string]: number } = {}
    invoices.forEach(invoice => {
      const number = invoice.number || invoice.invoiceNumber
      if (number) numberCounts[number] = (numberCounts[number] || 0) + 1
    })
    return Object.keys(numberCounts).filter(number => numberCounts[number] > 1)
  }, [invoices])

  // 2. Memoized visible subsets (needed for stats calculation)
  const visibleInvoices = useMemo(() => invoices.filter(inv => !hiddenInvoices.has(inv.id)), [invoices, hiddenInvoices])
  const visibleSearchResults = useMemo(() => searchResults.filter(inv => !hiddenInvoices.has(inv.id)), [searchResults, hiddenInvoices])

  // 3. Comprehensive Memoized Filter Chain
  const displayedInvoices = useMemo(() => {
    // Initial set from search or main list
    let list = showSearchResults ? visibleSearchResults : visibleInvoices

    // Apply status filter
    if (statusFilter) {
      list = list.filter(invoice => {
        const germanStatus = getGermanStatus(invoice.status)
        const isRefundFilter = statusFilter === 'Gutschrift'
        const isRefundInvoice = invoice && (
          invoice.type === 'REFUND' ||
          (typeof invoice.documentKind === 'string' && invoice.documentKind.includes('REFUND')) ||
          invoice.documentKind === 'CREDIT_NOTE'
        )
        return (germanStatus === statusFilter || invoice.status === statusFilter) || (isRefundFilter && isRefundInvoice)
      })
    }

    // Apply client-side advanced filters
    if (filterUnsent) {
      list = list.filter(inv => !emailStatuses[inv.id]?.sent)
    }

    if (filterDuplicates) {
      list = list.filter(inv => duplicateNumbers.includes(inv.number))
    }

    return list
  }, [visibleInvoices, visibleSearchResults, showSearchResults, statusFilter, filterUnsent, filterDuplicates, emailStatuses, duplicateNumbers])

  // (Removed redundant URL sync effect)

  // Handle date range changes (reset page)
  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      setPage(1)
    }
  }, [dateRange])

  // Custom event listener for invoice updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('invoicesUpdated', handleInvoiceUpdate)
      window.addEventListener('invoiceUpdated', handleInvoiceUpdate)
      window.addEventListener('invoiceStatusChanged', handleInvoiceUpdate)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('invoicesUpdated', handleInvoiceUpdate)
        window.removeEventListener('invoiceUpdated', handleInvoiceUpdate)
        window.removeEventListener('invoiceStatusChanged', handleInvoiceUpdate)
      }
    }
  }, [handleInvoiceUpdate])

  useEffect(() => {
    fetchInvoices()

    // Load hidden invoices from localStorage
    const savedHidden = localStorage.getItem('hiddenInvoices')
    if (savedHidden) {
      try {
        const hiddenIds = JSON.parse(savedHidden)
        setHiddenInvoices(new Set(hiddenIds))
      } catch (error) {
        console.error('Error loading hidden invoices:', error)
      }
    }

    // ---------------------------------------------------------
    // AUTO-REFRESH & SYNC POLLING (Every 30 seconds)
    // ---------------------------------------------------------
    let syncInterval: NodeJS.Timeout

    if (isAuthenticated && isAutoSyncing) {
      console.log('🔄 Starting Live-Refresh polling (every 60s)...') // Increased to 60s for stability
      syncInterval = setInterval(async () => {
        // Don't poll if page is not visible
        if (document.hidden) return

        try {
          // 1. Refresh existing invoices
          fetchInvoices(true)

          const res = await authenticatedFetch('/api/shopify/auto-sync')
          const data = await res.json()
          setLastSyncTime(new Date())

          if (data.synced > 0) {
            showToast(`${data.synced} neue Bestellungen gefunden!`, 'success')
            playNotificationSound()
          }
        } catch (err) {
          console.error('Auto-Sync failed:', err)
        }
      }, 60000) // 60 seconds
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchInvoices, isAutoSyncing, isAuthenticated])


  // Bulk Status Update
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedInvoices.size === 0) return

    try {
      showToast(`Aktualisiere Status für ${selectedInvoices.size} Rechnungen...`, 'info')

      const response = await authenticatedFetch('/api/invoices/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateStatus',
          ids: Array.from(selectedInvoices),
          status: newStatus
        })
      })

      if (response.ok) {
        showToast('Status erfolgreich aktualisiert', 'success')
        fetchInvoices(true)
        setSelectedInvoices(new Set())
        setShowBulkStatusUpdate(false)
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Fehler beim Aktualisieren des Status', 'error')
    }
  }

  // Handle search input change with debouncing (reset page to 1 on search)
  useEffect(() => {
    // If search query changes, set isSearching to true immediately (visual feedback)
    if (searchQuery !== debouncedSearchQuery) {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true)
      }

      const timeoutId = setTimeout(() => {
        setPage(1) // Reset to first page on new search
        setDebouncedSearchQuery(searchQuery)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, debouncedSearchQuery])

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  // Function to hide a mock invoice
  const handleHideInvoice = (invoiceId: string, invoiceNumber: string) => {
    const newHidden = new Set(hiddenInvoices)
    newHidden.add(invoiceId)
    setHiddenInvoices(newHidden)

    // Save to localStorage
    localStorage.setItem('hiddenInvoices', JSON.stringify(Array.from(newHidden)))

    showToast(`Beispiel - Rechnung "${invoiceNumber}" wurde ausgeblendet`, 'success')
  }

  // Function to show hidden invoices
  const handleShowHidden = () => {
    setHiddenInvoices(new Set())
    localStorage.removeItem('hiddenInvoices')
    showToast('Alle ausgeblendeten Rechnungen werden wieder angezeigt', 'success')
  }

  // (Filtering moved to memoized logic above)

  // Function to handle PDF download - FIXED VERSION
  const handleDownloadPdf = useCallback(async (invoiceId: string, invoiceNumber: string) => {
    console.log('🔄 Starting PDF download for:', invoiceId, invoiceNumber)

    let toastId = ''
    try {
      toastId = showToast('PDF wird generiert...', 'loading')
      const response = await authenticatedFetch(`/api/invoices/${invoiceId}/download-pdf`)

      if (!response.ok) {
        console.error('Download failed with status:', response.status)
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rechnung_${invoiceNumber || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      showToast('PDF erfolgreich heruntergeladen', 'success')
    } catch (error) {
      console.error('Download error:', error)
      showToast('Fehler beim PDF-Download', 'error')
    } finally {
      if (toastId) removeToast(toastId)
    }
  }, [showToast, removeToast])

  // Checkbox handling functions
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(displayedInvoices.map(inv => inv.id)))
    } else {
      setSelectedInvoices(new Set())
    }
  }, [displayedInvoices])

  const handleSelectInvoice = useCallback((invoiceId: string, checked: boolean) => {
    const next = new Set(selectedInvoices)
    if (checked) {
      next.add(invoiceId)
    } else {
      next.delete(invoiceId)
    }
    setSelectedInvoices(next)
  }, [selectedInvoices])

  // Stable handlers for row interactions
  const handleHover = useCallback((id: string | null) => {
    setHoveredRow(id)
  }, [])

  const handleSelect = useCallback((id: string, checked: boolean) => {
    handleSelectInvoice(id, checked)
  }, [handleSelectInvoice])

  const handleCustomerClick = useCallback((email: string) => {
    if (!email) return
    setSelectedCustomerEmail(email)
    setIsDrawerOpen(true)
  }, [])

  // Delete handling functions
  const handleDeleteSingle = useCallback((invoiceId: string, invoiceNumber: string) => {
    setDeleteTarget({ type: 'single', ids: [invoiceId], invoiceNumber })
    setShowDeleteConfirm(true)
  }, [])

  const handleDeleteBulk = () => {
    const selectedIds = Array.from(selectedInvoices)
    setDeleteTarget({ type: 'bulk', ids: selectedIds })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const endpoint = deleteTarget.type === 'single'
        ? `/api/invoices/${deleteTarget.ids[0]}`
        : '/api/invoices/bulk-delete'

      const response = await authenticatedFetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: deleteTarget.type === 'bulk' ? JSON.stringify({ ids: deleteTarget.ids }) : undefined
      })

      if (response.ok) {
        // Remove deleted invoices from state
        setInvoices(prev => prev.filter(invoice => !deleteTarget.ids.includes(invoice.id)))
        setSelectedInvoices(new Set())

        // Show success message
        const message = deleteTarget.type === 'single'
          ? 'Rechnung gelöscht'
          : `${deleteTarget.ids.length} Rechnungen gelöscht`

        showToast(message, 'success')

      } else {
        const error = await response.json()

        // Handle different error types with specific messages
        if (response.status === 409) {
          if (error.code === 'MOCK_INVOICE') {
            // For mock invoices, offer to hide instead
            const invoiceNumber = deleteTarget.invoiceNumber || 'diese Rechnung'
            const confirmed = window.confirm(
              `Beispiel-/Test-Rechnung kann nicht gelöscht werden.\n\nMöchten Sie "${invoiceNumber}" stattdessen ausblenden?\n\n(Sie können ausgeblendete Rechnungen später wieder einblenden)`
            )
            if (confirmed && deleteTarget.ids.length > 0) {
              handleHideInvoice(deleteTarget.ids[0], invoiceNumber)
            }
          } else if (error.code === 'LOCKED_INVOICE') {
            showToast(`Rechnung kann nicht gelöscht werden: ${error.message}`, 'error')
          } else {
            showToast(`Löschen nicht möglich: ${error.message}`, 'error')
          }
        } else if (response.status === 404) {
          showToast('Rechnung nicht gefunden - möglicherweise bereits gelöscht oder aus Beispieldaten.', 'error')
        } else {
          showToast(`Fehler beim Löschen: ${error.message || 'Unbekannter Fehler'}`, 'error')
        }
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Netzwerkfehler beim Löschen', 'error')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteTarget({ type: 'single', ids: [] })
    }
  }

  const handleDownloadZip = async () => {
    const invoiceIds = selectedInvoices.size > 0
      ? Array.from(selectedInvoices)
      : invoices.map(invoice => invoice.id)

    console.log('Starting ZIP download with IDs:', invoiceIds)

    if (invoiceIds.length === 0) {
      showToast('Keine Rechnungen zum Herunterladen verfügbar', 'error')
      return
    }

    setIsDownloadingZip(true)
    // Show a toast if it takes longer than 1 second (simulated by just showing it, user perception handles the rest)
    // or we can use a timeout to show it only if it's slow.
    // For now, let's show a "Preparing" toast immediately which is good UX.
    const loadingToastId = setTimeout(() => {
      showToast('ZIP-Datei wird erstellt... Bitte warten', 'info')
    }, 1000)

    try {
      console.log('Sending request to /api/download-invoices-zip')
      const response = await authenticatedFetch('/api/download-invoices-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds })
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to download ZIP')
      }

      // Get the ZIP file as blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `Rechnungen_${new Date().toISOString().split('T')[0]}.zip`

      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      const count = selectedInvoices.size > 0 ? selectedInvoices.size : invoices.length
      clearTimeout(loadingToastId) // Clear the loading toast timer if it finished fast
      showToast(`${count} Rechnungen als ZIP heruntergeladen`, 'success')

    } catch (error) {
      console.error('ZIP download error:', error)
      showToast('Fehler beim Herunterladen der ZIP-Datei', 'error')
    } finally {
      clearTimeout(loadingToastId)
      setIsDownloadingZip(false)
    }
  }

  const handleCleanupDuplicates = async () => {
    const confirmed = window.confirm(
      'Duplikate bereinigen?\n\nDies wird alle doppelten Rechnungen entfernen und nur die erste Version jeder Rechnung behalten.\n\nDiese Aktion kann nicht rückgängig gemacht werden.'
    )

    if (!confirmed) {
      return
    }

    setCleaningUp(true)

    try {
      console.log('Starting cleanup of duplicate invoices...')

      const response = await authenticatedFetch('/api/cleanup-duplicates', {
        method: 'POST'
      })

      console.log('Cleanup response status:', response.status)
      const data = await response.json()
      console.log('Cleanup response data:', data)

      if (response.ok) {
        showToast(`Bereinigung erfolgreich! ${data.duplicatesRemoved} Duplikate entfernt.`, 'success')

        // Refresh the invoice list
        fetchInvoices()
      } else {
        console.error('Cleanup failed:', data)
        showToast(data.message || 'Fehler beim Bereinigen der Duplikate', 'error')
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      showToast('Netzwerkfehler beim Bereinigen der Duplikate', 'error')
    } finally {
      setCleaningUp(false)
    }
  }

  const handleSyncInvoice = useCallback(async (invoice: any) => {
    if (!invoice?.orderId) {
      showToast('Keine Shopify-Order-ID vorhanden', 'error')
      return
    }

    try {
      showToast('Mزامنة الـ Invoice مع Shopify...', 'loading')
      // Existing sync logic...
      fetchInvoices(true)
    } catch (error) {
      showToast('Fehler bei der Synchronisation', 'error')
    }
  }, [fetchInvoices, showToast])

  const handleDeleteByNumber = async (invoiceNumber: string) => {
    const confirmed = window.confirm(
      `Alle Rechnungen mit Nummer "${invoiceNumber}" löschen?\n\nDies wird alle Duplikate dieser Rechnung entfernen.\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
    )

    if (!confirmed) {
      return
    }

    setDeletingByNumber(invoiceNumber)

    try {
      console.log('Deleting invoices with number:', invoiceNumber)

      const response = await authenticatedFetch('/api/delete-invoice-by-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceNumber })
      })

      console.log('Delete by number response status:', response.status)
      const data = await response.json()
      console.log('Delete by number response data:', data)

      if (response.ok) {
        showToast(`${data.deletedCount} Rechnung(en) erfolgreich gelöscht!`, 'success')

        // Refresh the invoice list
        fetchInvoices()
      } else {
        console.error('Delete by number failed:', data)
        showToast(data.message || 'Fehler beim Löschen der Rechnungen', 'error')
      }
    } catch (error) {
      console.error('Delete by number error:', error)
      showToast('Netzwerkfehler beim Löschen der Rechnungen', 'error')
    } finally {
      setDeletingByNumber(null)
    }
  }

  // Status color helper (moved to use constants or passed as static)
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Bezahlt': return 'bg-green-100 text-green-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'Offen': return 'bg-yellow-100 text-yellow-800'
      case 'SENT': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'STORNIERT': return 'bg-red-100 text-red-800'
      case 'OVERDUE': return 'bg-orange-100 text-orange-800'
      case 'ÜBERFÄLLIG': return 'bg-orange-100 text-orange-800'
      case 'REFUND': return 'bg-purple-100 text-purple-800'
      case 'ERSTATTET': return 'bg-purple-100 text-purple-800'
      case 'GUTSCHRIFT': return 'bg-purple-100 text-purple-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }, [])

  // Helper function to get invoice type icon and color
  const getInvoiceTypeDisplay = (invoice: any) => {
    if (!invoice) return { icon: <FileText className="h-4 w-4" />, color: 'text-gray-600', label: 'Rechnung' }
    if (invoice.type === InvoiceType.CANCELLATION || invoice.status === 'Storniert' || invoice.documentKind === 'CANCELLATION') {
      return { icon: <CircleX className="h-4 w-4" />, color: 'text-red-600', label: 'Storno' }
    }
    if (invoice.type === InvoiceType.REFUND || invoice.status === 'Gutschrift' || invoice.documentKind === 'CREDIT_NOTE' || (invoice.documentKind && typeof invoice.documentKind === 'string' && invoice.documentKind.includes('REFUND'))) {
      return { icon: <DollarSign className="h-4 w-4" />, color: 'text-blue-600', label: 'Gutschrift' }
    }
    return { icon: <FileText className="h-4 w-4" />, color: 'text-gray-600', label: 'Rechnung' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Rechnungen werden geladen...</p>
        </div>
      </div>
    )
  }

  // Calculate statistics (based on ALL visible invoices, ignoring current filter for the counts themselves)
  // We want the counts to remain static/global based on the search context, not the filter context
  const statsBaseInvoices = showSearchResults ? visibleSearchResults : visibleInvoices

  // Use total count from API if available (for pagination/filtering), otherwise fallback to loaded length
  const totalInvoices = globalTotalCount > 0 ? globalTotalCount : statsBaseInvoices.length

  // Note: These counts are now fetched from the API for accuracy across all pages
  const paidInvoices = paidInvoicesCount
  const openInvoices = openInvoicesCount
  const overdueInvoices = overdueInvoicesCount
  const cancelledInvoices = cancelledInvoicesCount
  const refundInvoices = refundInvoicesCount
  const duplicateCount = duplicateNumbers.length

  return (
    <div className="min-h-screen bg-gray-50">
      <ImportSuccessBanner />
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">

            {/* LEFT ZONE: Navigation & Title */}
            <div className="flex items-center">
              {/* Navigation Icons - Pulled left to align Title with content container edge */}
              <div className="hidden xl:flex items-center -ml-16 mr-6">
                <HeaderNavIcons />
              </div>
              <div className="flex xl:hidden items-center mr-6">
                <HeaderNavIcons />
              </div>

              {/* Title Group - This now aligns with the content boundary on desktop */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 leading-none">
                    Rechnungen
                    {user?.isAdmin && (
                      <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide">
                        Admin
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                      <div className="w-1 px-1 h-1 bg-emerald-500 rounded-full"></div>
                      LIVE
                    </div>
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Verwaltung & Übersicht</p>
                </div>
              </div>
            </div>

            {/* RIGHT ZONE: Actions */}
            <div className="flex items-center gap-6 mr-2 lg:mr-4">
              {/* AUTOMAT TOGGLE - Moved to right side */}
              <div className="hidden lg:flex items-center pr-6 border-r border-gray-200">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                    <Zap className={`h-2.5 w-2.5 ${dunningEnabled ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                    Mahnbot
                  </span>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="dunning-toggle"
                      checked={dunningEnabled}
                      onCheckedChange={toggleDunning}
                      disabled={loadingDunning}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className={`text-xs font-black uppercase tracking-tight ${dunningEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {dunningEnabled ? 'Aktiv' : 'Aus'}
                    </span>
                  </div>
                </div>
              </div>
              {/* ... mobile actions ... */}
              <div className="md:hidden flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={showAnalytics ? "bg-gray-100 text-gray-900" : "text-gray-500"}
                >
                  <BarChart3 className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Export Optionen</DropdownMenuLabel>
                    {/* ZIP, Word, Excel visible in desktop, summarized in mobile dropdown */}
                    <DropdownMenuItem onClick={handleDownloadZip} disabled={isDownloadingZip}>
                      <Archive className="h-4 w-4 mr-2" />
                      ZIP Download
                    </DropdownMenuItem>
                    <div className="p-1">
                      <DocxExportButton
                        selectedIds={Array.from(selectedInvoices)}
                        filters={{
                          status: statusFilter || undefined,
                          dateFrom: dateRange.from ? new Date(dateRange.from) : undefined,
                          dateTo: dateRange.to ? new Date(dateRange.to) : undefined,
                          searchQuery: showSearchResults ? searchQuery : undefined,
                          displayedInvoices: displayedInvoices.map(inv => inv.id)
                        }}
                        totalCount={displayedInvoices.length}
                        selectedCount={selectedInvoices.size}
                        className="w-full justify-start border-none shadow-none h-auto py-2 px-2 font-normal"
                      />
                    </div>
                    <div className="p-1">
                      <ExcelExportButton
                        selectedIds={Array.from(selectedInvoices)}
                        filters={{
                          status: statusFilter || undefined,
                          dateFrom: dateRange.from ? new Date(dateRange.from) : undefined,
                          dateTo: dateRange.to ? new Date(dateRange.to) : undefined,
                          searchQuery: showSearchResults ? searchQuery : undefined,
                          displayedInvoices: displayedInvoices.map(inv => inv.id)
                        }}
                        totalCount={displayedInvoices.length}
                        selectedCount={selectedInvoices.size}
                        className="w-full justify-start border-none shadow-none h-auto py-2 px-2 font-normal"
                      />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleShowHidden()}>
                      <Eye className="h-4 w-4 mr-2" /> Ausgeblendete ({hiddenInvoices.size})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      // Similar sound logic
                      const newState = !isSoundEnabled
                      if (newState) {
                        await unlockAudioContext()
                        if (!audioRef.current) { audioRef.current = new Audio('/sounds/cha-ching.mp3'); audioRef.current.load() }
                        audioRef.current.play()
                        setIsSoundEnabled(true); setIsAudioBlessed(true)
                      } else { setIsSoundEnabled(false) }
                    }}>
                      {isSoundEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                      Ton {isSoundEnabled ? 'an' : 'aus'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Actions - Shifted slightly left via container margin */}
              <div className="hidden md:flex items-center gap-3">
                {/* Sync Button (Icon Only) */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (isAutoSyncing) return;
                      setIsAutoSyncing(true);
                      showToast('Shopify Sync gestartet...', 'info');
                      try {
                        const res = await authenticatedFetch('/api/shopify/auto-sync');
                        const data = await res.json();
                        setLastSyncTime(new Date());
                        if (data.synced > 0 || data.updated > 0) {
                          showToast(`${data.synced} neue / ${data.updated} aktualisierte Bestellungen gefunden!`, 'success');
                          fetchInvoices(true);
                        } else if (data.message === 'Shopify not configured') {
                          showToast('Shopify ist nicht konfiguriert. Bitte in den Einstellungen prüfen.', 'warning');
                        } else {
                          showToast('Alles aktuell. Keine neuen Bestellungen gefunden.', 'info');
                        }
                      } catch (err) {
                        showToast('Sync fehlgeschlagen', 'error');
                      } finally {
                        setIsAutoSyncing(false);
                      }
                    }}
                    disabled={isAutoSyncing}
                    title="Synchronisieren"
                    className={`h-10 w-10 p-0 rounded-[10px] border-gray-200 text-gray-700 hover:bg-[#F3F4F6] hover:border-blue-200 transition-all active:translate-y-[1px] shadow-sm flex items-center justify-center focus-visible:ring-0 focus-visible:ring-offset-0 outline-none ${isAutoSyncing ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <RefreshCw className={`h-[18px] w-[18px] ${isAutoSyncing ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
                  </Button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1" />

                <Button
                  variant={showAnalytics ? "secondary" : "outline"}
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={`h-10 px-3 rounded-[10px] border-gray-200 font-medium shadow-sm flex items-center gap-2 transition-all active:translate-y-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none ${showAnalytics ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 hover:bg-[#F3F4F6]'}`}
                >
                  <BarChart3 className="h-[18px] w-[18px]" />
                  <span>Analysen</span>
                </Button>

                <div className="h-6 w-px bg-gray-200 mx-1" />

                {/* Exports Dropdown - Best enterprise UX */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 px-4 rounded-[10px] border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:bg-[#F3F4F6] flex items-center gap-2 transition-all active:translate-y-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                    >
                      <Download className="h-[18px] w-[18px] text-gray-500" />
                      Export
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100 p-1">
                    <DropdownMenuItem
                      onClick={handleDownloadZip}
                      disabled={isDownloadingZip}
                      className="rounded-lg h-10 px-3 flex items-center gap-3 cursor-pointer"
                    >
                      <Archive className="h-[18px] w-[18px] text-orange-500" />
                      <span>Als ZIP laden</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <div className="p-0">
                      <DocxExportButton
                        selectedIds={Array.from(selectedInvoices)}
                        filters={{
                          status: statusFilter || undefined,
                          dateFrom: dateRange.from ? new Date(dateRange.from) : undefined,
                          dateTo: dateRange.to ? new Date(dateRange.to) : undefined,
                          searchQuery: showSearchResults ? searchQuery : undefined,
                          displayedInvoices: displayedInvoices.map(inv => inv.id)
                        }}
                        totalCount={displayedInvoices.length}
                        selectedCount={selectedInvoices.size}
                        variant="ghost"
                        className="w-full justify-start border-none shadow-none h-10 px-3 font-normal rounded-lg"
                      />
                    </div>

                    <div className="p-0">
                      <ExcelExportButton
                        selectedIds={Array.from(selectedInvoices)}
                        filters={{
                          status: statusFilter || undefined,
                          dateFrom: dateRange.from ? new Date(dateRange.from) : undefined,
                          dateTo: dateRange.to ? new Date(dateRange.to) : undefined,
                          searchQuery: showSearchResults ? searchQuery : undefined,
                          displayedInvoices: displayedInvoices.map(inv => inv.id)
                        }}
                        totalCount={displayedInvoices.length}
                        selectedCount={selectedInvoices.size}
                        variant="ghost"
                        className="w-full justify-start border-none shadow-none h-10 px-3 font-normal rounded-lg"
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>
        </div>

        {isDownloadingZip && (
          <div className="w-full h-1 bg-green-100 overflow-hidden">
            <div className="h-full bg-green-500 animate-pulse w-full origin-left"></div>
          </div>
        )}
      </header>

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Mehrere Suchbegriffe mit Komma trennen: max@email.com, peter@gmail.com, RE001, Anna Schmidt"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Suche löschen"
                  aria-label="Suche löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Zeige Selector - Polished Version */}
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-[10px] px-4 py-2 h-[42px] shadow-sm hover:border-blue-200 transition-colors">
              <span className="text-sm font-semibold text-slate-500">Zeige</span>
              <div className="relative flex items-center">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="appearance-none bg-transparent pl-2 pr-8 py-0.5 text-sm font-bold text-slate-900 cursor-pointer focus:outline-none z-10"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="250">250</option>
                  <option value="500">500 (Max)</option>
                </select>
                <ChevronDown className="absolute right-0 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {limit > 100 && (
                <span className="text-[10px] text-orange-500 font-medium ml-1 flex items-center gap-1">
                  <TriangleAlert className="h-3 w-3" />
                  Performance
                </span>
              )}
            </div>

            {isSearching && (
              <div className="text-sm text-gray-500">Suche läuft...</div>
            )}



            {showSearchResults && (
              <div className="text-sm text-gray-600">
                {searchResults.length} Rechnung(en) gefunden
                {searchQuery.includes(',') || searchQuery.includes(';') ? (
                  <span className="ml-1">
                    (Mehrfachsuche: {searchQuery.split(/[,;|\n\r\t]+/).filter(t => t.trim()).length} Begriffe)
                  </span>
                ) : (
                  <span className="ml-1">für "{searchQuery}"</span>
                )}
                {searchResults.length > 0 && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </div>
            )}
          </div>

          {/* Date Filter & Bulk Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Zeitraum:</span>
              <input
                type="date"
                className="text-sm border rounded px-2 py-1"
                value={dateRange.from || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value || null }))}
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                className="text-sm border rounded px-2 py-1"
                value={dateRange.to || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value || null }))}
              />
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: null, to: null })}
                  className="h-8 px-2 text-gray-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-8"
            >
              <Filter className="h-3 w-3 mr-2" />
              Filter
              {(filterPaymentMethod || filterMinAmount || filterMaxAmount || filterNewCustomers || filterUnsent || filterDuplicates) && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-1.5 rounded-full">
                  {[filterPaymentMethod, filterMinAmount, filterMaxAmount, filterNewCustomers, filterUnsent, filterDuplicates].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* Active Filters Badges */}
            {(filterPaymentMethod || filterMinAmount || filterMaxAmount || filterNewCustomers || filterUnsent || filterDuplicates) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterPaymentMethod('')
                  setFilterMinAmount('')
                  setFilterMaxAmount('')
                  setFilterNewCustomers(false)
                  setFilterUnsent(false)
                  setFilterDuplicates(false)
                }}
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Filter zurücksetzen
              </Button>
            )}

            {selectedInvoices.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm font-medium text-blue-600">{selectedInvoices.size} ausgewählt</span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowBulkStatusUpdate(true)}
                >
                  <Pencil className="h-3 w-3 mr-2" />
                  Status ändern
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowAccountantDialog(true)}
                >
                  <Send className="h-3 w-3 mr-2" />
                  An Steuerberater
                </Button>
              </div>
            )}

          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Zahlungsmethode</label>
                  <select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md text-sm p-2"
                  >
                    <option value="">Alle</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Klarna">Klarna</option>
                    <option value="Vorkasse">Vorkasse</option>
                    <option value="Rechnung">Rechnung</option>
                    <option value="custom">Vorkasse / Rechnung (Custom)</option>
                    <option value="Shopify Payments">Shopify Payments</option>
                    <option value="Credit Card">Kreditkarte</option>
                    <option value="Amazon Pay">Amazon Pay</option>
                  </select>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Betrag (€)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-md text-sm p-2"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-md text-sm p-2"
                    />
                  </div>
                </div>

                {/* Checkboxes Group 1 */}
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterNewCustomers}
                      onChange={(e) => setFilterNewCustomers(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Nur neue Kunden (30 Tage)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterUnsent}
                      onChange={(e) => setFilterUnsent(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">E-Mail nicht gesendet</span>
                  </label>
                </div>

                {/* Checkboxes Group 2 */}
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterDuplicates}
                      onChange={(e) => setFilterDuplicates(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Nur Duplikate anzeigen</span>
                  </label>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showBulkStatusUpdate} onOpenChange={setShowBulkStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status für {selectedInvoices.size} Rechnungen ändern</DialogTitle>
            <DialogDescription>
              Wählen Sie den neuen Status für die ausgewählten Rechnungen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {['Bezahlt', 'Offen', 'Mahnung', 'Storniert', 'Gutschrift'].map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className={`justify-start ${getStatusColor(status)}`}
                  onClick={() => handleBulkStatusUpdate(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAccountantDialog} onOpenChange={setShowAccountantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>An Steuerberater senden</DialogTitle>
            <DialogDescription>
              Senden Sie {selectedInvoices.size} ausgewählte Rechnungen an Ihren Steuerberater.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-Mail-Adresse des Steuerberaters</label>
              <Input
                type="email"
                placeholder="steuerberater@kanzlei.de"
                value={accountantEmail}
                onChange={(e) => setAccountantEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAccountantDialog(false)}>Abbrechen</Button>
              <Button
                onClick={async () => {
                  if (!accountantEmail) return
                  setSendingAccountant(true)
                  try {
                    const response = await authenticatedFetch('/api/invoices/send-to-accountant', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        invoiceIds: Array.from(selectedInvoices),
                        accountantEmail
                      })
                    })
                    const result = await response.json()
                    if (result.success) {
                      setShowAccountantDialog(false)
                      // Show success toast (need to implement toast or just alert)
                      alert(`Erfolgreich an ${accountantEmail} gesendet!`)
                      setSelectedInvoices(new Set())
                    } else {
                      alert('Fehler: ' + result.error)
                    }
                  } catch (e) {
                    alert('Fehler beim Senden')
                  } finally {
                    setSendingAccountant(false)
                  }
                }}
                disabled={sendingAccountant || !accountantEmail}
              >
                {sendingAccountant ? 'Sende...' : 'Senden'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Analytics Section */}
        {showAnalytics && <AnalyticsDashboard />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === null ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/50' : 'hover:bg-gray-50'}`}
            onClick={() => setStatusFilter(null)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gesamt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900" title={String(totalInvoices)}>{totalInvoices}</div>
              <p className="text-xs text-gray-500">Alle Rechnungen</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Offen' ? 'ring-2 ring-yellow-500 shadow-md bg-yellow-50/50' : 'hover:bg-gray-50'} ${openInvoices === 0 ? 'opacity-50' : ''}`}
            onClick={() => setStatusFilter('Offen')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Offen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" title={String(openInvoices)}>{openInvoices}</div>
              <p className="text-xs text-gray-500">Unbezahlt</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Überfällig' ? 'ring-2 ring-red-500 shadow-md bg-red-50/50' : 'hover:bg-gray-50'} ${overdueInvoices === 0 ? 'opacity-50' : ''}`}
            onClick={() => setStatusFilter('Überfällig')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Überfällig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" title={String(overdueInvoices)}>{overdueInvoices}</div>
              <p className="text-xs text-gray-500">Verspätet</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Bezahlt' ? 'ring-2 ring-green-500 shadow-md bg-green-50/50' : 'hover:bg-gray-50'} ${paidInvoices === 0 ? 'opacity-50' : ''}`}
            onClick={() => setStatusFilter('Bezahlt')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bezahlt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" title={String(paidInvoices)}>{paidInvoices}</div>
              <p className="text-xs text-gray-500">Abgeschlossen</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Storniert' ? 'ring-2 ring-gray-500 shadow-md bg-gray-50/50' : 'hover:bg-gray-50'} ${cancelledInvoices === 0 ? 'opacity-50' : ''}`}
            onClick={() => setStatusFilter('Storniert')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Storniert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500" title={String(cancelledInvoices)}>{cancelledInvoices}</div>
              <p className="text-xs text-gray-500">Stornos</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Gutschrift' ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/50' : 'hover:bg-gray-50'} ${refundInvoices === 0 ? 'opacity-50' : ''}`}
            onClick={() => setStatusFilter('Gutschrift')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gutschriften
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-blue-600" title={String(refundInvoicesCount)}>{refundInvoicesCount}</div>
                <div className="text-sm font-semibold text-blue-400">
                  ({safeFormatCurrency(totalRefundAmount)})
                </div>
              </div>
              <p className="text-xs text-gray-500">Rückerstattungen</p>
            </CardContent>
          </Card>



          {/* 19% VAT Card */}
          <Card className={`bg-violet-50 border-violet-100 ${vat19Sum === 0 ? 'opacity-50' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-violet-700">
                19 % MwSt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-xl font-bold text-violet-700"
                title={safeFormatCurrency(vat19Sum)}
              >
                {safeFormatCurrency(vat19Sum)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Steuerbetrag (19%)
              </p>
            </CardContent>
          </Card>

          {/* Total Paid Amount Card */}
          <Card className={`bg-emerald-50 border-emerald-100 ${totalPaidAmount === 0 ? 'opacity-50' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">
                Gesamtbetrag (bezahlt)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-xl font-bold text-emerald-700"
                title={safeFormatCurrency(totalPaidAmount)}
              >
                {safeFormatCurrency(totalPaidAmount)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                nur abgeschlossene Zahlungen
              </p>
            </CardContent>
          </Card>

          {/* Shopify Gebühren Card */}
          <Card className={`bg-orange-50 border-orange-100 ${totalShopifyFees === 0 ? 'opacity-50' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Shopify Gebühren
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-xl font-bold text-orange-700"
                title={safeFormatCurrency(totalShopifyFees)}
              >
                {safeFormatCurrency(totalShopifyFees)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Zahlungsgebühren (2.9% + €0,30)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Rechnungen</CardTitle>
            <CardDescription>
              Übersicht über alle erstellten Rechnungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions Bar */}
            {selectedInvoices.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedInvoices.size} Rechnung{selectedInvoices.size !== 1 ? 'en' : ''} ausgewählt
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteBulk}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ausgewählte löschen ({selectedInvoices.size})
                </Button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Alle auswählen"
                    />
                  </TableHead>
                  <TableHead>Bestellnummer</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Datum
                      <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />
                      <span className="text-xs text-gray-500 ml-1">(Neueste zuerst)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Zahlung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="table-fixed">
                {/* Hydration safe rendering */}
                {isMounted && displayedInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    isHovered={hoveredRow === invoice.id}
                    onHover={handleHover}
                    isSelected={selectedInvoices.has(invoice.id)}
                    onSelectChange={handleSelect}
                    isDuplicate={duplicateNumbers.includes(invoice.number)}
                    emailStatus={emailStatuses[invoice.id]}
                    onRefresh={fetchInvoices}
                    onDownload={handleDownloadPdf}
                    onDelete={handleDeleteSingle}
                    onSync={handleSyncInvoice}
                    onCustomerClick={handleCustomerClick}
                    safeFormatDate={safeFormatDate}
                    safeFormatTime={safeFormatTime}
                    safeFormatCurrency={safeFormatCurrency}
                    getPaymentMethodDisplay={getPaymentMethodDisplay}
                    getStatusColor={getStatusColor}
                    getGermanStatus={getGermanStatus}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Empty State (if no invoices or no search results) */}
        {
          displayedInvoices.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {showSearchResults ? 'Keine Rechnungen gefunden' : 'Noch keine Rechnungen erstellt'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {showSearchResults
                    ? `Keine Rechnungen entsprechen der Suche "${searchQuery}". Versuchen Sie andere Suchbegriffe.`
                    : 'Erstellen Sie Ihre erste Rechnung oder laden Sie CSV-Daten hoch.'
                  }
                </p>
                {showSearchResults ? (
                  <Button onClick={clearSearch} variant="outline">
                    Suche zurücksetzen
                  </Button>
                ) : (
                  <div className="flex justify-center space-x-4">
                    <Link href="/invoices/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Neue Rechnung
                      </Button>
                    </Link>
                    <Link href="/upload">
                      <Button variant="outline">
                        CSV hochladen
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        }

        {/* Pagination Controls */}
        {
          displayedInvoices.length > 0 && !showSearchResults && (
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Seite {page} von {totalPages}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Zurück
                </Button>
                <span className="hidden sm:inline text-sm text-gray-600">
                  {totalInvoicesCount} Einträge
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Weiter
                </Button>
              </div>
            </div>
          )
        }

        {/* Delete Confirmation Dialog */}
        {
          showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {deleteTarget.type === 'single'
                    ? 'Rechnung wirklich löschen?'
                    : `${deleteTarget.ids.length} Rechnungen wirklich löschen?`
                  }
                </h3>
                {deleteTarget.type === 'single' && deleteTarget.invoiceNumber && (
                  <p className="text-sm text-gray-600 mb-6">
                    Die Rechnung "{deleteTarget.invoiceNumber}" wird unwiderruflich gelöscht.
                  </p>
                )}
                {deleteTarget.type === 'bulk' && (
                  <p className="text-sm text-gray-600 mb-6">
                    Die ausgewählten {deleteTarget.ids.length} Rechnungen werden unwiderruflich gelöscht.
                  </p>
                )}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteTarget({ type: 'single', ids: [] })
                    }}
                    disabled={deleting}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird gelöscht...
                      </>
                    ) : (
                      'Ja, löschen'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        }
      </main>

      {/* Komponente für den Massenversand */}
      {
        showBulkEmailSender && (
          <BulkEmailSender
            selectedInvoices={Array.from(selectedInvoices)}
            onClose={() => setShowBulkEmailSender(false)}
          />
        )
      }

      <CustomerHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customerEmail={selectedCustomerEmail}
        allInvoices={invoices}
      />


    </div >
  )
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Rechnungen...</p>
        </div>
      </div>
    }>
      <InvoicesPageContent />
    </Suspense>
  )
}
