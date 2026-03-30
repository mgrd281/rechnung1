'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Download, Edit, Mail, ArrowLeft, FileText,
  TriangleAlert, User, ExternalLink, CreditCard,
  Clock, CircleCheck, CircleX, MoreVertical,
  Calendar, MapPin, Phone, Building, Printer,
  RefreshCcw, ShieldAlert,
  Loader2, Zap
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth-compat'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InvoicePreviewDialog } from '@/components/invoice-preview-dialog'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ReminderEditDialog } from '@/components/reminder-edit-dialog'
import { DEFAULT_REMINDER_TEMPLATES } from '@/lib/reminder-types'

// --- Interfaces ---
interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  ean?: string
  kaufquelleSnapshot?: string | null
  kaufdatumSnapshot?: string | Date | null
  kaufpreisSnapshot?: number | null
  shopifyProductId?: string | null
  shopifyVariantId?: string | null
}

interface Customer {
  id: string
  name: string
  companyName?: string
  email: string
  address: string
  zipCode: string
  city: string
  country: string
  phone?: string
}

interface Organization {
  id: string
  name: string
  address: string
  zipCode: string
  city: string
  country: string
  taxId: string
  bankName: string
  iban: string
  bic: string
}

interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: string
  customer: Customer
  organization: Organization
  items: InvoiceItem[]
  order?: {
    id: string
    shopifyOrderId?: string
  }
  history?: any[]
  paymentMethod?: string
  headerSubject?: string | null
  headerText?: string | null
  footerText?: string | null
  serviceDate?: string | null
  settings?: any
}

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = (s: string) => {
    switch (s.toLowerCase()) {
      case 'bezahlt': case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'offen': case 'sent': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'mahnung': case 'overdue': return 'bg-red-100 text-red-700 border-red-200'
      case 'storniert': case 'cancelled': return 'bg-gray-100 text-gray-500 border-gray-200 line-through'
      case 'erstattet': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles(status)} inline-flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.toLowerCase() === 'bezahlt' ? 'bg-emerald-500' : 'bg-current'}`} />
      {status}
    </span>
  )
}

const TimelineItem = ({ event, index, isLast }: { event: any, index: number, isLast: boolean }) => {
  // Map Prisma 'type' and 'detail' to what the component expects
  const action = event.type || event.action || 'Aktion'
  const detailText = event.detail || event.details

  const getIcon = (act: string) => {
    if (!act) return <Clock className="h-4 w-4" />
    const lowerAct = act.toLowerCase()
    if (lowerAct.includes('email') || lowerAct.includes('mail')) return <Mail className="h-4 w-4" />
    if (lowerAct.includes('download')) return <Download className="h-4 w-4" />
    if (lowerAct.includes('status')) return <RefreshCcw className="h-4 w-4" />
    if (lowerAct.includes('erstellt') || lowerAct.includes('created')) return <FileText className="h-4 w-4" />
    if (lowerAct.includes('paid') || lowerAct.includes('bezahlt')) return <CircleCheck className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  return (
    <div className="relative pl-6 pb-6" key={event.id || index}>
      {!isLast && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />}
      <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
        {getIcon(action)}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-900">{action}</span>
        <span className="text-xs text-slate-500">{event.createdAt ? new Date(event.createdAt).toLocaleString('de-DE') : 'Unbekanntes Datum'}</span>
        {detailText && <span className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">{detailText}</span>}
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function InvoiceViewPage() {
  const { navigate } = useSafeNavigation()
  const params = useParams()
  const id = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editableInvoice, setEditableInvoice] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Dunning Automation State
  const [dunningEnabled, setDunningEnabled] = useState(false)
  const [loadingDunning, setLoadingDunning] = useState(false)

  // Reminder Edit Dialog State
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [selectedReminderLevel, setSelectedReminderLevel] = useState<'reminder' | 'first_notice' | 'second_notice' | 'final_notice'>('reminder')
  const [reminderSubject, setReminderSubject] = useState('')
  const [reminderBody, setReminderBody] = useState('')

  const { showToast, removeToast } = useToast()
  const authenticatedFetch = useAuthenticatedFetch()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [updateGlobalPurchaseInfo, setUpdateGlobalPurchaseInfo] = useState(false)

  const fetchDunningSettings = async () => {
    try {
      const res = await authenticatedFetch('/api/dunning/settings')
      if (res.ok) {
        const data = await res.json()
        setDunningEnabled(data.enabled || false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleDunning = async (enabled: boolean) => {
    setLoadingDunning(true)
    try {
      const getRes = await authenticatedFetch('/api/dunning/settings')
      let currentSettings = { enabled: false }
      if (getRes.ok) currentSettings = await getRes.json()

      const res = await authenticatedFetch('/api/dunning/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentSettings, enabled })
      })

      if (res.ok) {
        setDunningEnabled(enabled)
        showToast(enabled ? 'Mahnbot Aktiv' : 'Mahnbot Aus', 'success')
      }
    } catch (e) {
      showToast('Fehler', 'error')
    } finally {
      setLoadingDunning(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchInvoice()
      fetchDunningSettings()
    }
  }, [id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`)
      if (!response.ok) throw new Error('Invoice not found')
      const invoiceData = await response.json()
      setInvoice(invoiceData)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      showToast('Rechnung konnte nicht geladen werden', 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- Actions ---

  const downloadInvoicePDF = async () => {
    if (!invoice) return
    setDownloadingPdf(true)
    let toastId = ''
    try {
      toastId = showToast('PDF wird generiert...', 'loading')
      const response = await fetch(`/api/invoices/${invoice.id}/download-pdf`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const blob = await response.blob()
        if (blob.size > 100) {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${invoice.number}.pdf`
          link.click()
          window.URL.revokeObjectURL(url)
          showToast('PDF heruntergeladen', 'success')
        } else throw new Error('PDF leer')
      } else throw new Error('Server Error')
    } catch (error) {
      showToast('Fehler beim PDF Download', 'error')
    } finally {
      if (toastId) removeToast(toastId)
      setDownloadingPdf(false)
    }
  }

  const downloadInvoiceWord = async () => {
    if (!invoice) return
    setDownloadingWord(true)
    let toastId = ''
    try {
      toastId = showToast('Word Dokument wird generiert...', 'loading')
      const response = await fetch(`/api/invoices/${invoice.id}/download-word`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${invoice.number}.docx`
        link.click()
        window.URL.revokeObjectURL(url)
        showToast('Word Dokument heruntergeladen', 'success')
      } else throw new Error('Server Error')
    } catch (error) {
      showToast('Fehler beim Word Download', 'error')
    } finally {
      if (toastId) removeToast(toastId)
      setDownloadingWord(false)
    }
  }

  const handleSendEmail = async () => {
    if (!invoice) return
    setSendingEmail(true)
    let toastId = ''
    try {
      toastId = showToast('E-Mail wird gesendet...', 'loading')
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerEmail: invoice.customer.email,
          customerName: invoice.customer.name,
          invoiceNumber: invoice.number,
          emailSubject: `Rechnung ${invoice.number}`,
          emailMessage: `Guten Tag ${invoice.customer.name},\n\nanbei Ihre Rechnung ${invoice.number}.`,
          invoiceAmount: invoice.total,
          dueDate: invoice.dueDate
        }),
      })

      const result = await response.json()
      if (result.success) {
        showToast('E-Mail erfolgreich versendet', 'success')
      }
      else throw new Error(result.error)
    } catch (error) {
      showToast('Fehler beim Senden', 'error')
    } finally {
      if (toastId) removeToast(toastId)
      setSendingEmail(false)
    }
  }

  const handleSendReminder = async (level: 'reminder' | 'first_notice' | 'second_notice' | 'final_notice' = 'reminder') => {
    if (!invoice) return

    // Get template for this level
    const template = DEFAULT_REMINDER_TEMPLATES[level]

    // Replace variables in template
    let subject = template.subject
    let body = template.body

    // Replace common variables
    const replacements: Record<string, string> = {
      '{{invoice_number}}': invoice.number || '',
      '{{customer_name}}': invoice.customer?.name || '',
      '{{invoice_date}}': invoice.date ? new Date(invoice.date).toLocaleDateString('de-DE') : '',
      '{{due_date}}': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('de-DE') : '',
      '{{total_amount}}': `${invoice.total.toFixed(2)} €`,
      '{{open_amount}}': `${invoice.total.toFixed(2)} €`,
      '{{company_name}}': 'Karinex',
      '{{days_overdue}}': invoice.dueDate ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))).toString() : '0'
    }

    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value)
      body = body.replace(new RegExp(key, 'g'), value)
    })

    // Set state and open dialog
    setSelectedReminderLevel(level)
    setReminderSubject(subject)
    setReminderBody(body)
    setShowReminderDialog(true)
  }

  const handleActualSendReminder = async (subject: string, body: string) => {
    if (!invoice) return
    setSendingReminder(true)
    let toastId = ''
    try {
      toastId = showToast('Erinnerung wird gesendet...', 'loading')
      const response = await fetch('/api/reminders/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          reminderLevel: selectedReminderLevel,
          customSubject: subject,
          customBody: body
        }),
      })
      if (response.ok) {
        showToast('Erinnerung gesendet', 'success')
      }
      else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed')
      }
    } catch (e: any) {
      showToast(e.message || 'Fehler beim Senden', 'error')
      throw e // Re-throw to keep dialog open
    } finally {
      if (toastId) removeToast(toastId)
      setSendingReminder(false)
    }
  }

  const handleCancel = async () => {
    if (!invoice) return
    if (invoice.order?.shopifyOrderId) {
      if (window.confirm('Bestellung auch in Shopify stornieren?')) {
        let cancelToastId = ''
        try {
          cancelToastId = showToast('Shopify-Stornierung läuft...', 'loading')
          const response = await fetch('/api/shopify/cancel-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: invoice.id }),
          })
          const result = await response.json()
          if (result.success) showToast('Shopify-Bestellung storniert', 'success')
        } catch (error) {
          showToast('Shopify-Fehler', 'error')
        } finally {
          if (cancelToastId) removeToast(cancelToastId)
        }
      }
    }
    navigate(`/invoices/${invoice.id}/cancel`)
  }

  // --- Edit Mode Logic ---

  const handleEditInvoice = () => {
    if (!invoice) return
    setEditableInvoice({ ...invoice, items: [...invoice.items] })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editableInvoice) return
    setSaving(true)
    try {
      // Recalc totals
      const subtotal = editableInvoice.items.reduce((sum, item) => sum + item.total, 0)
      const taxAmount = subtotal * (editableInvoice.taxRate / 100)
      const total = subtotal + taxAmount
      const updated = { ...editableInvoice, subtotal, taxAmount, total }

      const res = await fetch(`/api/invoices/${editableInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          updateGlobalPurchaseInfo
        }),
      })

      if (res.ok) {
        setInvoice(updated)
        setIsEditing(false)
        showToast('Gespeichert', 'success')
      } else throw new Error('Save failed')
    } catch (e) {
      showToast('Fehler beim Speichern', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateEditableItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!editableInvoice) return
    const newItems = [...editableInvoice.items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    setEditableInvoice({ ...editableInvoice, items: newItems })
  }

  const updateEditableCustomer = (field: keyof Customer, value: any) => {
    if (!editableInvoice) return
    setEditableInvoice({
      ...editableInvoice,
      customer: {
        ...editableInvoice.customer,
        [field]: value
      }
    })
  }

  // --- Render ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Lade Rechnungsdetails...</p>
      </div>
    </div>
  )

  if (!invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="max-w-md w-full text-center p-6">
        <TriangleAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Rechnung nicht gefunden</h2>
        <p className="text-slate-500 mt-2 mb-6">Diese Rechnung existiert nicht oder wurde gelöscht.</p>
        <Button onClick={() => navigate('/invoices')}>Zurück zur Übersicht</Button>
      </Card>
    </div>
  )

  const activeInvoice = isEditing && editableInvoice ? editableInvoice : invoice

  return (
    <div className="min-h-screen bg-slate-50/50">

      {/* 1) TOP HEADER (SUMMARY BAR) */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-4">

            {/* Left: Info */}
            <div className="flex items-center gap-6 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/invoices')}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rechnung {activeInvoice.number?.startsWith('#') ? activeInvoice.number : `#${activeInvoice.number}`}</h1>
                  <StatusBadge status={activeInvoice.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{activeInvoice.date ? new Date(activeInvoice.date).toLocaleDateString() : 'K.A.'}</span>
                  <span className="text-slate-300 mx-1">|</span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">{activeInvoice.customer?.name || 'Gast'}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions & Total */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gesamtbetrag</span>
                <span className="text-xl font-bold text-slate-900">
                  {(activeInvoice.total).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden md:block" />

              {/* AUTOMAT TOGGLE */}
              <div className="hidden lg:flex items-center px-4 border-r border-slate-200 mr-2">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                    <Zap className={`h-2.5 w-2.5 ${dunningEnabled ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                    Mahnbot
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="dunning-toggle"
                      checked={dunningEnabled}
                      onCheckedChange={toggleDunning}
                      disabled={loadingDunning}
                      className="scale-75 data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={saving} className="h-9 text-slate-500">
                      Abbrechen
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="h-9 bg-green-600 hover:bg-green-700 text-white shadow-sm px-4">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                      Speichern
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={downloadInvoicePDF} disabled={downloadingPdf} className="h-9">
                      {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      PDF
                    </Button>

                    <Button variant="outline" size="sm" onClick={downloadInvoiceWord} disabled={downloadingWord} className="h-9">
                      {downloadingWord ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-2 text-blue-600" />}
                      Word
                    </Button>

                    <Button size="sm" onClick={handleSendEmail} disabled={sendingEmail} className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                      Senden
                    </Button>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleEditInvoice}><Edit className="h-4 w-4 mr-2" /> Bearbeiten</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPreview(true)}><Printer className="h-4 w-4 mr-2" /> Vorschau</DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadInvoiceWord} disabled={downloadingWord}>
                      <FileText className="h-4 w-4 mr-2 text-blue-600" /> Word Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSendReminder('reminder')} disabled={sendingReminder}><Clock className="h-4 w-4 mr-2" /> Zahlungserinnerung</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendReminder('first_notice')} disabled={sendingReminder}><Clock className="h-4 w-4 mr-2" /> 1. Mahnung</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendReminder('second_notice')} disabled={sendingReminder}><Clock className="h-4 w-4 mr-2" /> 2. Mahnung</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendReminder('final_notice')} disabled={sendingReminder}><Clock className="h-4 w-4 mr-2" /> Letzte Mahnung</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCancel} className="text-red-600"><CircleX className="h-4 w-4 mr-2" /> Stornieren</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT COLUMN (Content) */}
          <div className="lg:col-span-2 space-y-8">

            {/* ITEMS CARD */}
            <Card className="border-0 shadow-sm ring-1 ring-slate-900/5 bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Positionen</CardTitle>
                  {isEditing && <Button size="sm" variant="ghost" className="text-blue-600 h-8 text-xs">+ Artikel</Button>}
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Produkt</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-slate-500 w-[100px]">Menge</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-slate-500 w-[120px]">Preis (Netto)</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-slate-500 w-[120px]">Gesamt (Netto)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeInvoice.items.map((item, idx) => (
                      <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="py-4">
                          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                            <FileText className="h-4 w-4" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {isEditing ? (
                            <Input value={item.description} onChange={e => updateEditableItem(idx, 'description', e.target.value)} className="h-8 text-sm" />
                          ) : (
                            item.description
                          )}

                          {/* Purchase Info Block */}
                          <div className="mt-2 text-[10px] flex flex-wrap gap-x-4 gap-y-1 text-slate-400">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className="font-medium text-slate-500">Kaufen:</span>
                              {isEditing ? (
                                <input
                                  value={item.kaufquelleSnapshot || ''}
                                  onChange={e => updateEditableItem(idx, 'kaufquelleSnapshot', e.target.value)}
                                  className="h-5 text-[10px] w-32 px-1 border rounded bg-white"
                                  placeholder="Quelle..."
                                />
                              ) : (
                                <span className="text-slate-600 font-medium">{item.kaufquelleSnapshot || '—'}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className="font-medium text-slate-500">Kauf Datum:</span>
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={item.kaufdatumSnapshot ? new Date(item.kaufdatumSnapshot).toISOString().split('T')[0] : ''}
                                  onChange={e => updateEditableItem(idx, 'kaufdatumSnapshot', e.target.value)}
                                  className="h-5 text-[10px] w-28 px-1 border rounded bg-white"
                                />
                              ) : (
                                <span className="text-slate-600 font-medium">{item.kaufdatumSnapshot ? new Date(item.kaufdatumSnapshot).toLocaleDateString('de-DE') : '—'}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className="font-medium text-slate-500">Kauf Preis:</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.kaufpreisSnapshot || ''}
                                  onChange={e => updateEditableItem(idx, 'kaufpreisSnapshot', parseFloat(e.target.value))}
                                  className="h-5 text-[10px] w-16 px-1 text-right border rounded bg-white"
                                />
                              ) : (
                                <span className="text-slate-600 font-medium">{item.kaufpreisSnapshot ? item.kaufpreisSnapshot.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '0,00 €'}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {isEditing ? (
                            <Input type="number" value={item.quantity} onChange={e => updateEditableItem(idx, 'quantity', parseFloat(e.target.value))} className="h-8 text-sm text-right" />
                          ) : item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {isEditing ? (
                            <Input type="number" value={item.unitPrice} onChange={e => updateEditableItem(idx, 'unitPrice', parseFloat(e.target.value))} className="h-8 text-sm text-right" />
                          ) : item.unitPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {item.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {isEditing && (
                <div className="px-6 py-3 border-t border-slate-100 bg-amber-50/30 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="updateGlobal"
                    checked={updateGlobalPurchaseInfo}
                    onChange={e => setUpdateGlobalPurchaseInfo(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="updateGlobal" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                    Kauf-Infos auch global für diese Produkte/Varianten aktualisieren
                  </label>
                </div>
              )}

              {/* TOTALS BLOCK */}
              <div className="bg-slate-50/30 p-6 border-t border-slate-100">
                <div className="flex flex-col items-end gap-2 text-sm">
                  <div className="flex justify-between w-64 text-slate-500">
                    <span>Zwischensumme</span>
                    <span>{activeInvoice.subtotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between w-64 text-slate-500">
                    <span>MwSt ({activeInvoice.taxRate}%)</span>
                    <span>{activeInvoice.taxAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="w-64 h-px bg-slate-200 my-1" />
                  <div className="flex justify-between w-64 text-lg font-bold text-slate-900">
                    <span>Gesamt</span>
                    <span>{activeInvoice.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* HISTORY CARD */}
            <div className="pl-2">
              <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Verlauf & Aktivitäten
              </h3>
              <div className="ml-2">
                {(!invoice.history || invoice.history.length === 0) ? (
                  <p className="text-sm text-slate-400 italic pl-6">Keine Aktivitäten protokolliert.</p>
                ) : (
                  invoice.history.map((event, i) => (
                    <TimelineItem key={i} event={event} index={i} isLast={i === (invoice.history?.length || 0) - 1} />
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Sidebar) */}
          <div className="space-y-6 lg:sticky lg:top-24">

            {/* CUSTOMER CARD */}
            <Card className="border-0 shadow-sm ring-1 ring-slate-900/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
                  Kunde
                  <User className="h-4 w-4 text-slate-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                    {(activeInvoice.customer?.name || 'G').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={activeInvoice.customer?.name || ''}
                          onChange={e => updateEditableCustomer('name', e.target.value)}
                          placeholder="Name"
                          className="h-8 text-sm font-semibold"
                        />
                        <Input
                          value={activeInvoice.customer?.email || ''}
                          onChange={e => updateEditableCustomer('email', e.target.value)}
                          placeholder="Email"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-slate-900">{activeInvoice.customer?.name || 'Gast'}</div>
                        <div className="text-sm text-slate-500 break-all">{activeInvoice.customer?.email || ''}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 space-y-2 border border-slate-100">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={activeInvoice.customer.address}
                        onChange={e => updateEditableCustomer('address', e.target.value)}
                        placeholder="Straße"
                        className="h-8 text-sm bg-white"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={activeInvoice.customer.zipCode}
                          onChange={e => updateEditableCustomer('zipCode', e.target.value)}
                          placeholder="PLZ"
                          className="h-8 text-sm bg-white w-20"
                        />
                        <Input
                          value={activeInvoice.customer.city}
                          onChange={e => updateEditableCustomer('city', e.target.value)}
                          placeholder="Stadt"
                          className="h-8 text-sm bg-white flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-400" />
                      <div>
                        {activeInvoice.customer.address}<br />
                        {activeInvoice.customer.zipCode} {activeInvoice.customer.city}
                      </div>
                    </div>
                  )}
                  {activeInvoice.customer.phone && !isEditing && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{activeInvoice.customer.phone}</span>
                    </div>
                  )}
                  {isEditing && (
                    <Input
                      value={activeInvoice.customer.phone || ''}
                      onChange={e => updateEditableCustomer('phone', e.target.value)}
                      placeholder="Telefon"
                      className="h-8 text-sm bg-white"
                    />
                  )}
                </div>

                {activeInvoice.order?.shopifyOrderId && (
                  <Button variant="outline" className="w-full mt-4 h-9 text-xs" asChild>
                    <Link href={`https://admin.shopify.com/store/45dv93-bk/orders/${activeInvoice.order.shopifyOrderId}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      In Shopify öffnen
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* PAYMENT CARD */}
            <Card className="border-0 shadow-sm ring-1 ring-slate-900/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
                  Zahlungsinformationen
                  <CreditCard className="h-4 w-4 text-slate-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Status</div>
                  <StatusBadge status={activeInvoice.status} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Methode</div>
                    <div className="text-sm font-medium text-slate-900">{activeInvoice.paymentMethod || 'Standard'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Fällig am</div>
                    <div className="text-sm font-medium text-slate-900">{new Date(activeInvoice.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Payment Progress Bar (Simulated) */}
                {activeInvoice.status === 'Bezahlt' && (
                  <div className="bg-emerald-50 rounded-md p-3 border border-emerald-100 flex items-center gap-3">
                    <CircleCheck className="h-5 w-5 text-emerald-500" />
                    <div className="text-xs text-emerald-800 font-medium">
                      Diese Rechnung wurde vollständig beglichen.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QUICK ACTIONS CARD */}
            {isEditing ? (
              <Card className="border-blue-200 shadow-sm bg-blue-50/50">
                <CardContent className="p-4 space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-9" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Änderungen speichern'}
                  </Button>
                  <Button variant="ghost" className="w-full h-9 text-slate-600" onClick={() => setIsEditing(false)}>Abbrechen</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm ring-1 ring-slate-900/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-900">Schnellaktionen</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button variant="secondary" className="justify-start h-9 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm" onClick={handleSendEmail} disabled={sendingEmail}>
                    <Mail className="h-3.5 w-3.5 mr-2" /> E-Mail senden
                  </Button>
                  <Button variant="secondary" className="justify-start h-9 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm" onClick={() => handleSendReminder('reminder')} disabled={sendingReminder}>
                    <Clock className="h-3.5 w-3.5 mr-2" /> Zahlungserinnerung
                  </Button>
                  <Button variant="secondary" className="justify-start h-9 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm" onClick={() => handleSendReminder('first_notice')} disabled={sendingReminder}>
                    <Clock className="h-3.5 w-3.5 mr-2" /> 1. Mahnung
                  </Button>
                  <Button variant="secondary" className="justify-start h-9 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm" onClick={() => handleSendReminder('second_notice')} disabled={sendingReminder}>
                    <Clock className="h-3.5 w-3.5 mr-2" /> 2. Mahnung
                  </Button>
                  <Button variant="secondary" className="justify-start h-9 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm" onClick={() => handleSendReminder('final_notice')} disabled={sendingReminder}>
                    <Clock className="h-3.5 w-3.5 mr-2" /> Letzte Mahnung
                  </Button>
                  <div className="h-px bg-slate-100 my-1" />
                  <Button variant="ghost" className="justify-start h-9 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancel}>
                    <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Rechnung stornieren
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>

        </div>
      </main>

      <InvoicePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        design={invoice.settings?.design}
        onDesignChange={async (newDesign) => {
          setInvoice(prev => prev ? { ...prev, settings: { ...prev.settings, design: newDesign } } : null)
          try {
            await fetch(`/api/invoices/${invoice.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ design: newDesign })
            })
          } catch (err) { console.error(err) }
        }}
        data={{
          customer: invoice.customer,
          invoiceData: {
            invoiceNumber: invoice.number,
            date: invoice.date,
            dueDate: invoice.dueDate,
          },
          items: invoice.items,
          settings: { companySettings: invoice.organization }
        }}
      />

      <ReminderEditDialog
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
        reminderLevel={selectedReminderLevel}
        defaultSubject={reminderSubject}
        defaultBody={reminderBody}
        onSend={handleActualSendReminder}
        invoiceNumber={invoice.number || ''}
      />

    </div>
  )
}
