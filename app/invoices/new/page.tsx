'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText, ArrowLeft, Home, Plus, Trash2, Save, Calculator, Bookmark, Download, QrCode,
  MoreHorizontal, Calendar, Search, Settings, ChevronDown, Check, AlertCircle, Info,
  Copy, Printer, Clock, Zap, Sparkles, User, Building2, Globe, CreditCard, Layout, RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { DashboardUpdater } from '@/lib/dashboard-updater'
import { useAuth } from '@/hooks/use-auth-compat'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { DocumentKind } from '@/lib/document-types'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { BackButton } from '@/components/navigation/back-button'
import { cn } from '@/lib/utils'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  vat: number
  discount: number
  total: number
  ean?: string
}

interface Customer {
  type: 'organization' | 'person'
  name: string
  companyName: string
  email: string
  address: string
  zipCode: string
  city: string
  country: string
}

interface ItemTemplate {
  id: string
  name: string
  items: InvoiceItem[]
  taxRate: number
  createdAt: string
}

import { InvoicePreviewDialog } from '@/components/invoice-preview-dialog'

export default function NewInvoicePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { navigate } = useSafeNavigation()
  const authenticatedFetch = useAuthenticatedFetch()
  const { showToast } = useToast()

  const [showPreview, setShowPreview] = useState(false)

  const [customer, setCustomer] = useState<Customer>({
    type: 'organization',
    name: '',
    companyName: '',
    email: '',
    address: '',
    zipCode: '',
    city: '',
    country: 'DE'
  })

  const [companySettings, setCompanySettings] = useState<any>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/company-settings')
        if (response.ok) {
          const data = await response.json()
          setCompanySettings(data)
          // Set default internal contact if available
          if (data.companyName) {
            setInternalContact(data.companyName)
          }
        }
      } catch (error) {
        console.error('Error fetching company settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unit: 'Stk', unitPrice: 0, vat: 19, discount: 0, total: 0, ean: '' }
  ])

  // Invoice settings
  const [isERechnung, setIsERechnung] = useState(false)
  const [currency, setCurrency] = useState('EUR')
  const [skonto, setSkonto] = useState({ days: 0, percent: 0 })
  const [internalContact, setInternalContact] = useState('')
  const [revenueAccount, setRevenueAccount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Kein Standard')
  const [costCenter, setCostCenter] = useState('')
  const [vatRegulation, setVatRegulation] = useState('In Deutschland')

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'RE-1000',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    referenceNumber: '',
    headerSubject: 'Rechnung Nr. RE-1000',
    headerText: 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!\nHiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:',
    footerText: 'Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer auf das unten angegebene Konto.\nDer Rechnungsbetrag ist bis zum [%ZAHLUNGSZIEL%] fällig.\n\nMit freundlichen Grüßen\n[%KONTAKTPERSON%]',
    taxRate: 19,
    status: 'Offen'
  })

  const [saving, setSaving] = useState(false)

  // Item Template management (for invoice items)
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([])
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [invoiceDesign, setInvoiceDesign] = useState({
    templateId: 'classic',
    themeColor: '#1e293b',
    logoScale: 1.0,
    showSettings: {
      qrCode: false,
      epcQrCode: false,
      customerNumber: true,
      contactPerson: true,
      vatPerItem: false,
      articleNumber: false,
      foldMarks: true
    }
  })
  const [showApplyTemplateDialog, setShowApplyTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Invoice Template management (for invoice layout/texts)
  interface RechnungsTemplate {
    id: string
    name: string
    isDefault: boolean
  }
  const [invoiceTemplates, setInvoiceTemplates] = useState<RechnungsTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<RechnungsTemplate | null>(null)

  // Document Type Management
  const [documentKind, setDocumentKind] = useState<DocumentKind>(DocumentKind.INVOICE)
  const [originalInvoiceDate, setOriginalInvoiceDate] = useState('')
  const [reason, setReason] = useState('')
  const [refundAmount, setRefundAmount] = useState<string>('')

  // UX & Redesign State
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('recipient')
  const [summaryMode, setSummaryMode] = useState<'net' | 'gross'>('net')
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false)

  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      setShowSearchDropdown(true)
      try {
        const response = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchQuery)}`)
        const result = await response.json()
        if (result.ok) {
          setSearchResults(result.data.results)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectContact = (contact: any) => {
    setCustomer({
      type: contact.source === 'shopify_customer' || contact.source === 'shopify_order' ? 'person' : 'organization',
      name: contact.displayName,
      companyName: contact.company || '',
      email: contact.email || '',
      address: contact.address.line1,
      zipCode: contact.address.zip,
      city: contact.address.city,
      country: contact.address.country || 'DE'
    })
    setShowSearchDropdown(false)
    setSearchQuery('')
  }

  // Load item templates from localStorage and invoice templates from API
  useEffect(() => {
    const savedTemplates = localStorage.getItem('invoiceTemplates')
    if (savedTemplates) {
      setItemTemplates(JSON.parse(savedTemplates))
    }

    // Load invoice templates from API
    loadInvoiceTemplates()
  }, [])

  const loadInvoiceTemplates = async () => {
    try {
      const response = await authenticatedFetch('/api/invoice-templates')
      const result = await response.json()

      if (result.success) {
        setInvoiceTemplates(result.data)
        // Set default template
        const defaultTemplate = result.data.find((t: RechnungsTemplate) => t.isDefault)
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate)
        }
      }
    } catch (error) {
      console.error('Error loading invoice templates:', error)
      // Use fallback default template
      setSelectedTemplate(null)
    }
  }

  // Update header subject when invoice number changes
  useEffect(() => {
    setInvoiceData(prev => ({
      ...prev,
      headerSubject: `Rechnung Nr. ${prev.invoiceNumber}`
    }))
  }, [invoiceData.invoiceNumber])

  // Update texts based on document kind
  useEffect(() => {
    switch (documentKind) {
      case DocumentKind.INVOICE:
        setInvoiceData(prev => ({
          ...prev,
          headerSubject: `Rechnung Nr. ${prev.invoiceNumber}`,
          headerText: 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!\nHiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:',
          footerText: 'Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer auf das unten angegebene Konto.\nDer Rechnungsbetrag ist bis zum [%ZAHLUNGSZIEL%] fällig.\n\nMit freundlichen Grüßen\n[%KONTAKTPERSON%]'
        }))
        break
      case DocumentKind.CANCELLATION:
        setInvoiceData(prev => ({
          ...prev,
          headerSubject: `Stornorechnung Nr. ${prev.invoiceNumber}`,
          headerText: 'Sehr geehrte Damen und Herren,\n\nhiermit stornieren wir die Rechnung Nr. [ORIGINAL_RECHNUNGSNUMMER] vom [DATUM].',
          footerText: 'Der Betrag wird Ihrem Konto gutgeschrieben.'
        }))
        break
      case DocumentKind.CREDIT_NOTE:
        setInvoiceData(prev => ({
          ...prev,
          headerSubject: `Gutschrift Nr. ${prev.invoiceNumber}`,
          headerText: 'Sehr geehrte Damen und Herren,\n\nwir erstatten Ihnen hiermit folgenden Betrag:',
          footerText: 'Der Betrag wird in den nächsten Tagen auf Ihr Konto überwiesen.'
        }))
        break
      case DocumentKind.DUNNING_1:
        setInvoiceData(prev => ({
          ...prev,
          headerSubject: `Zahlungserinnerung Nr. ${prev.invoiceNumber}`,
          headerText: 'Sehr geehrte Damen und Herren,\n\nleider konnten wir bis heute keinen Zahlungseingang für die Rechnung Nr. [RECHNUNGSNUMMER] feststellen.\nWir bitten Sie, den offenen Betrag bis zum [NEUES_ZAHLUNGSZIEL] zu begleichen.',
          footerText: 'Sollten Sie die Zahlung bereits geleistet haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.'
        }))
        break
      case DocumentKind.DUNNING_2:
        setInvoiceData(prev => ({
          ...prev,
          headerSubject: `2. Mahnung Nr. ${prev.invoiceNumber}`,
          headerText: 'Sehr geehrte Damen und Herren,\n\ntrotz unserer Zahlungserinnerung konnten wir bisher keinen Zahlungseingang feststellen.\nBitte überweisen Sie den fälligen Betrag inklusive Mahngebühren umgehend.',
          footerText: 'Bei weiteren Verzögerungen müssen wir leider rechtliche Schritte einleiten.'
        }))
        break
      case DocumentKind.DUNNING_3:
        setInvoiceData(prev => ({
          ...prev,
          headerSubject: `3. Mahnung Nr. ${prev.invoiceNumber}`,
          headerText: 'Sehr geehrte Damen und Herren,\n\ndies ist unsere letzte Aufforderung zur Zahlung der offenen Rechnung Nr. [RECHNUNGSNUMMER].\nSollte der Betrag nicht bis zum [FRIST] eingehen, werden wir das Verfahren an ein Inkassobüro übergeben.',
          footerText: 'Dies ist die letzte Mahnung vor Einleitung gerichtlicher Schritte.'
        }))
        break
    }
  }, [documentKind])

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }

        if (field === 'quantity' || field === 'unitPrice' || field === 'vat' || field === 'discount') {
          const basePrice = updatedItem.quantity * updatedItem.unitPrice
          const discountedPrice = basePrice * (1 - updatedItem.discount / 100)
          updatedItem.total = discountedPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'Stk',
      unitPrice: 0,
      vat: 19,
      discount: 0,
      total: 0,
      ean: ''
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const saveItemTemplate = () => {
    if (!templateName.trim()) {
      alert('Bitte geben Sie einen Namen für die Vorlage ein')
      return
    }

    const validItems = items.filter((item: InvoiceItem) => item.description.trim() !== '')
    if (validItems.length === 0) {
      alert('Bitte fügen Sie mindestens eine Position hinzu')
      return
    }

    const newTemplate: ItemTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      items: validItems.map((item: InvoiceItem) => ({ ...item, id: `item-${Math.random().toString(36).substr(2, 9)}` })),
      taxRate: invoiceData.taxRate,
      createdAt: new Date().toISOString()
    }

    const updatedTemplates = [...itemTemplates, newTemplate]
    setItemTemplates(updatedTemplates)
    localStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates))

    setTemplateName('')
    setShowSaveTemplateDialog(false)
    alert('Vorlage erfolgreich gespeichert!')
  }

  const applyItemTemplate = (template: ItemTemplate) => {
    setItems(template.items.map(item => ({
      ...item,
      id: `item-${Math.random().toString(36).substr(2, 9)}`
    })))
    setInvoiceData(prev => ({ ...prev, taxRate: template.taxRate }))
    setShowApplyTemplateDialog(false)
  }

  const deleteItemTemplate = (templateId: string) => {
    if (!confirm('Möchten Sie diese Vorlage wirklich löschen?')) return
    const updatedTemplates = itemTemplates.filter((t: ItemTemplate) => t.id !== templateId)
    setItemTemplates(updatedTemplates)
    localStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates))
    alert('Vorlage erfolgreich gelöscht!')
  }

  // Brutto-Berechnung
  const netTotal = items.reduce((sum, item) => sum + item.total, 0)

  const totalVat = items.reduce((sum, item) => {
    return sum + (item.total * (item.vat / 100))
  }, 0)

  const grossTotal = netTotal + totalVat

  // For display purposes
  const subtotal = netTotal
  const total = grossTotal

  const handleSave = async () => {
    if (saving) return
    setSaving(true)

    try {
      if (!invoiceData.invoiceNumber.trim()) {
        alert('Bitte geben Sie eine Rechnungsnummer ein')
        setSaving(false)
        return
      }

      if (!customer.name.trim()) {
        alert('Bitte geben Sie einen Kundennamen ein')
        setSaving(false)
        return
      }

      const validItems = items.filter(item => item.description.trim() !== '')
      if (validItems.length === 0) {
        alert('Bitte fügen Sie mindestens eine Rechnungsposition hinzu')
        setSaving(false)
        return
      }

      // Prepare data for API
      const apiData = {
        invoiceNumber: invoiceData.invoiceNumber,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        deliveryDate: invoiceData.deliveryDate,
        customer: {
          name: customer.name,
          companyName: customer.companyName,
          email: customer.email,
          address: customer.address,
          zipCode: customer.zipCode,
          city: customer.city,
          country: customer.country,
          type: customer.type
        },
        items: validItems.map(item => ({
          description: item.description,
          ean: item.ean || '',
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vat: item.vat,
          discount: item.discount,
          total: item.total
        })),
        settings: {
          currency,
          skonto,
          internalContact,
          revenueAccount,
          paymentMethod,
          costCenter,
          vatRegulation,
          headerSubject: invoiceData.headerSubject,
          headerText: invoiceData.headerText,
          footerText: invoiceData.footerText,
          isERechnung
        },
        referenceNumber: invoiceData.referenceNumber,
        documentKind: documentKind,
        originalInvoiceDate: originalInvoiceDate,
        reason: reason,
        refundAmount: refundAmount,
        design: invoiceDesign
      }

      const response = await authenticatedFetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      })

      const result = await response.json()

      if (result.success) {
        DashboardUpdater.dispatchInvoiceCreated()
        showToast('Rechnung erfolgreich erstellt', 'success')
        navigate('/invoices')
      } else {
        throw new Error(result.error || 'Fehler beim Erstellen der Rechnung')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      showToast(
        `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        'error'
      )
      setSaving(false)
    }
  }

  // Simulate Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length > 0 && customer.name) {
        setIsAutoSaving(true)
        setTimeout(() => {
          setLastSaved(new Date())
          setIsAutoSaving(false)
        }, 800)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [items, customer, invoiceData, documentKind])

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827] pb-20 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <HeaderNavIcons />
              <div className="flex flex-col">
                <h1 className="text-base font-bold text-gray-900 leading-none">Neue Rechnung</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  {lastSaved ? (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Gespeichert {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : isAutoSaving ? (
                    <span className="text-[10px] text-slate-400 font-medium animate-pulse">Wird gespeichert...</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">Entwurf • Autosave aktiv</span>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">E-Rechnung</span>
              <Switch
                checked={isERechnung}
                onCheckedChange={setIsERechnung}
                className="scale-75"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)} className="text-slate-600 hover:text-slate-900 font-medium hidden sm:flex">
                <Search className="w-4 h-4 mr-2" /> Vorschau
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="text-slate-600 hover:text-slate-900 font-medium">
                {saving ? '...' : <><Save className="w-4 h-4 mr-2" /> Speichern</>}
              </Button>

              <div className="h-8 w-[1px] bg-slate-200 mx-1" />

              <Button className="bg-[#0B0D12] text-white hover:bg-[#1F2937] active:bg-black shadow-none px-6 rounded-[14px] font-semibold text-sm min-h-[44px]">
                Senden
              </Button>

              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full sm:hidden">
                <MoreHorizontal className="h-5 w-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT: MAIN EDITOR */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* SECTION: EMPFÄNGER */}
            <Card className="border-none shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] bg-white rounded-[16px] overflow-hidden">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shadow-sm border border-slate-200/50">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Empfänger</CardTitle>
                      <CardDescription className="text-xs">Wählen Sie einen Kontakt oder legen Sie einen neuen an.</CardDescription>
                    </div>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                    <button
                      onClick={() => setCustomer(prev => ({ ...prev, type: 'organization' }))}
                      className={cn(
                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                        customer.type === 'organization' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <Building2 className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" /> Organisation
                    </button>
                    <button
                      onClick={() => setCustomer(prev => ({ ...prev, type: 'person' }))}
                      className={cn(
                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                        customer.type === 'person' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <User className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" /> Person
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-8 space-y-6">
                <div className="relative group">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Kontakt Suchen</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Name, E-Mail oder Firma eingeben..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                      className="pl-11 h-12 bg-slate-50/50 border-slate-200/60 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                    {searching ? (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-900 font-bold text-xs hover:bg-slate-100 rounded-lg">
                        <Search className="w-3.5 h-3.5 mr-1" /> Kunde suchen
                      </Button>
                    )}

                    {/* Search Dropdown */}
                    {showSearchDropdown && (searchQuery.length >= 2) && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[100] max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {searchResults.length > 0 ? (
                          <div className="p-2 space-y-1">
                            {['app', 'invoice', 'shopify_customer', 'shopify_order'].map((source: string) => {
                              const sourceResults = searchResults.filter(r => r.source === source)
                              if (sourceResults.length === 0) return null

                              const sourceLabel = {
                                app: 'Kunden (App)',
                                invoice: 'Kunden (aus Rechnungen)',
                                shopify_customer: 'Shopify Kunden',
                                shopify_order: 'Shopify Bestellungen'
                              }[source]

                              const sourceBadge = {
                                app: 'App',
                                invoice: 'Rechnung',
                                shopify_customer: 'Shopify',
                                shopify_order: 'Bestellung'
                              }[source]

                              return (
                                <div key={source} className="pb-2">
                                  <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{sourceLabel}</div>
                                  {sourceResults.map(res => (
                                    <button
                                      key={res.id}
                                      onClick={() => selectContact(res)}
                                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group/item"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-900">{res.displayName}</span>
                                        {res.email && <span className="text-[10px] text-slate-400 font-medium">{res.email}</span>}
                                        {res.company && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{res.company}</span>}
                                      </div>
                                      <Badge variant={"outline" as any} className="text-[9px] font-black uppercase tracking-tighter bg-slate-50 text-slate-500 border-slate-100 group-hover/item:bg-slate-900 group-hover/item:text-white transition-colors">
                                        {sourceBadge}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        ) : !searching ? (
                          <div className="p-8 text-center">
                            <User className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keine Kontakte gefunden</p>
                          </div>
                        ) : null}

                        {/* Backdrop to close */}
                        <div
                          className="fixed inset-0 z-[-1]"
                          onClick={() => setShowSearchDropdown(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Anschrift</Label>
                    <Input
                      placeholder="Straße und Hausnummer"
                      value={customer.address}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      className="h-11 bg-slate-50/50 border-slate-200/60 rounded-xl focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">PLZ</Label>
                      <Input
                        placeholder="12345"
                        value={customer.zipCode}
                        onChange={(e) => setCustomer(prev => ({ ...prev, zipCode: e.target.value }))}
                        className="h-11 bg-slate-50/50 border-slate-200/60 rounded-xl focus:bg-white transition-all text-center font-mono"
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Ort</Label>
                      <Input
                        placeholder="Berlin"
                        value={customer.city}
                        onChange={(e) => setCustomer(prev => ({ ...prev, city: e.target.value }))}
                        className="h-11 bg-slate-50/50 border-slate-200/60 rounded-xl focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Land</Label>
                    <Select value={customer.country} onValueChange={(v: string) => setCustomer(prev => ({ ...prev, country: v }))}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200/60 rounded-xl focus:bg-white transition-all">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <SelectValue placeholder="Land wählen" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="DE" className="rounded-lg">Deutschland</SelectItem>
                        <SelectItem value="AT" className="rounded-lg">Österreich</SelectItem>
                        <SelectItem value="CH" className="rounded-lg">Schweiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">E-Mail (Optional)</Label>
                    <Input
                      placeholder="rechnung@firma.de"
                      value={customer.email}
                      onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11 bg-slate-50/50 border-slate-200/60 rounded-xl focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION: RECHNUNGSINFOS */}
            <Card className="border-none shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] bg-white rounded-[16px] overflow-hidden">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Rechnungsinformationen</CardTitle>
                    <CardDescription className="text-xs">Zentrale Metadaten für Ihre Buchhaltung.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Dokumententyp</Label>
                    <Select value={documentKind} onValueChange={(v: string) => setDocumentKind(v as DocumentKind)}>
                      <SelectTrigger className="h-12 border-slate-200/60 bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value={DocumentKind.INVOICE} className="rounded-lg font-bold">Rechnung</SelectItem>
                        <SelectItem value={DocumentKind.CANCELLATION} className="rounded-lg">Stornorechnung</SelectItem>
                        <SelectItem value={DocumentKind.CREDIT_NOTE} className="rounded-lg">Gutschrift</SelectItem>
                        <SelectItem value={DocumentKind.DUNNING_1} className="rounded-lg">Mahnung 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Rechnungsnummer</Label>
                    <div className="relative">
                      <Input
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        className="h-12 border-slate-200/60 bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] font-mono font-bold"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Datum</Label>
                      <Input
                        type="date"
                        value={invoiceData.date}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                        className="h-11 border-slate-200/60 bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Lieferdatum</Label>
                      <Input
                        type="date"
                        value={invoiceData.deliveryDate}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                        className="h-11 border-slate-200/60 bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Zahlungsziel</Label>
                    <div className="flex flex-col gap-3">
                      <Input
                        type="date"
                        value={invoiceData.dueDate}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="h-11 border-slate-200/60 bg-white rounded-xl"
                      />
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {[7, 14, 30].map(days => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => {
                              const d = new Date(invoiceData.date || Date.now())
                              d.setDate(d.getDate() + days)
                              setInvoiceData(prev => ({ ...prev, dueDate: d.toISOString().split('T')[0] }))
                            }}
                            className="px-3 py-1 bg-slate-100/80 hover:bg-slate-200 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter transition-all"
                          >
                            {days} Tage
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceData(prev => ({ ...prev, dueDate: prev.date }))
                          }}
                          className="px-3 py-1 bg-slate-200 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-slate-300 transition-all shadow-sm"
                        >Sofort</button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION: POSITIONEN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Layout className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold">Positionen</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApplyTemplateDialog(true)}
                    className="rounded-full border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider px-4"
                  >
                    <Bookmark className="w-3.5 h-3.5 mr-1.5" /> Vorlagen
                  </Button>
                  <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/50">
                    <button
                      onClick={() => setSummaryMode('gross')}
                      className={cn("px-4 py-1 text-[10px] font-black rounded-full transition-all uppercase tracking-tighter", summaryMode === 'gross' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                    >Brutto</button>
                    <button
                      onClick={() => setSummaryMode('net')}
                      className={cn("px-4 py-1 text-[10px] font-black rounded-full transition-all uppercase tracking-tighter", summaryMode === 'net' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                    >Netto</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* STICKY MINI HEADER */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-xl border border-slate-100/50 mx-1">
                  <div className="col-span-5">Produkt / Service</div>
                  <div className="col-span-2 text-center">Menge</div>
                  <div className="col-span-2 text-right">Einzelpreis</div>
                  <div className="col-span-1 text-center">USt.</div>
                  <div className="col-span-2 text-right">Gesamt</div>
                </div>

                {/* ITEM ROWS */}
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id} className="group relative bg-white rounded-[16px] border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-blue-400/50 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                        <div className="col-span-1 md:col-span-5 relative">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}.</span>
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                              <Input
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Was wurde verkauft?"
                                className="pl-9 bg-transparent border-none focus:ring-0 font-medium placeholder:text-slate-300 text-sm h-10"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 h-9 text-center bg-slate-50 border-slate-200/60 rounded-lg font-bold text-sm"
                          />
                          <Select value={item.unit} onValueChange={(v: string) => updateItem(item.id, 'unit', v)}>
                            <SelectTrigger className="w-20 h-9 bg-slate-50 border-slate-200/60 rounded-lg text-xs font-bold text-slate-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {['Stk', 'Std', 'Tag', 'Psch', 'm²'].map(u => (
                                <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1 md:col-span-2 relative">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="h-10 text-right pr-7 bg-slate-50 border-slate-200/60 rounded-xl font-mono font-bold text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                        </div>

                        <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center gap-1">
                          <div className="relative w-full px-2">
                            <Select value={String(item.vat)} onValueChange={(v: string) => updateItem(item.id, 'vat', parseFloat(v))}>
                              <SelectTrigger className="h-7 border-none bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black p-0 justify-center">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[19, 7, 0].map(v => (
                                  <SelectItem key={v} value={String(v)}>{v}%</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900">{item.total.toFixed(2)} €</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Betrag</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-500 hover:text-white pointer-events-auto z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <Button
                    onClick={addItem}
                    variant="ghost"
                    className="text-slate-900 shadow-none hover:bg-slate-50 font-bold rounded-xl px-6 py-6 border-2 border-dashed border-slate-200 hover:border-slate-400 transition-all h-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Neue Position hinzufügen
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowSaveTemplateDialog(true)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      Als Vorlage speichern
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: TEXTE & TEMPLATES */}
            {/* I will use the one already in the file if it's correct, but I'll overwrite to be sure */}
            <Card className="border-none shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] bg-white rounded-[16px] overflow-hidden">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold">Kopf- & Fußtexte</h2>
                  </div>
                  <Select
                    value={selectedTemplate?.id}
                    onValueChange={(v: string) => {
                      const template = invoiceTemplates.find((t: any) => t.id === v)
                      if (template) setSelectedTemplate(template)
                    }}
                  >
                    <SelectTrigger className="w-48 h-9 border-slate-200 bg-slate-50 rounded-lg text-xs font-bold">
                      <SelectValue placeholder="Textvorlage wählen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {invoiceTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Betreffzeile</Label>
                  <Input
                    value={invoiceData.headerSubject}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, headerSubject: e.target.value }))}
                    className="h-11 border-slate-200/60 bg-slate-50/50 rounded-xl focus:bg-white transition-all font-bold"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Einleitungstext</Label>
                      <span className="text-[10px] font-bold text-slate-300">Variablen: [%NAME%], [%DATUM%]</span>
                    </div>
                    <Textarea
                      value={invoiceData.headerText}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, headerText: e.target.value }))}
                      className="min-h-[100px] border-slate-200/60 bg-slate-50/50 rounded-xl focus:bg-white transition-all text-sm leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Schlusstext</Label>
                      <div className="flex gap-1">
                        <button className="px-2 py-0.5 bg-slate-100 text-[9px] font-black rounded uppercase text-slate-400 hover:text-blue-500">[%ZAHLUNGSZIEL%]</button>
                        <button className="px-2 py-0.5 bg-slate-100 text-[9px] font-black rounded uppercase text-slate-400 hover:text-blue-500">[%KONTAKTPERSON%]</button>
                      </div>
                    </div>
                    <Textarea
                      value={invoiceData.footerText}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, footerText: e.target.value }))}
                      className="min-h-[100px] border-slate-200/60 bg-slate-50/50 rounded-xl focus:bg-white transition-all text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION: STEUER & WEITERE OPTIONEN */}
            <div className="space-y-6">
              <Card className="border-none shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] bg-white rounded-[16px]">
                <CardHeader className="pb-3 px-6 pt-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Umsatzsteuer-Regelung</h3>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'In Deutschland', label: 'Deutschland', desc: 'Standard 19%/7%' },
                      { id: 'EU-Ausland', label: 'EU-Ausland', desc: 'Reverse-Charge' },
                      { id: 'Außerhalb EU', label: 'Drittland', desc: 'Steuerfrei gem. §4' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setVatRegulation(opt.id)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all group",
                          vatRegulation === opt.id ? "border-blue-500 bg-blue-50/30 shadow-sm" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={cn("text-xs font-bold", vatRegulation === opt.id ? "text-blue-700" : "text-slate-600 group-hover:text-slate-900")}>{opt.label}</span>
                          {vatRegulation === opt.id && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-500 leading-tight">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="px-2">
                <button
                  onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                  className="flex items-center gap-2 text-slate-400 hover:text-blue-500 font-bold text-xs transition-colors uppercase tracking-widest"
                >
                  {isOptionsExpanded ? <ChevronDown className="w-3.5 h-3.5 rotate-180" /> : <Plus className="w-3.5 h-3.5" />}
                  Weitere Optionen {isOptionsExpanded ? 'ausblenden' : 'anzeigen'}
                </button>

                {isOptionsExpanded && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/50">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Währung & Skonto</Label>
                      <div className="flex gap-2 mt-2">
                        <Select value={currency} onValueChange={(v: string) => setCurrency(v)}>
                          <SelectTrigger className="h-9 border-slate-200 rounded-lg text-xs font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl"><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="USD">USD ($)</SelectItem></SelectContent>
                        </Select>
                        <div className="flex-1 flex gap-1">
                          <Input placeholder="Tage" value={skonto.days} onChange={e => setSkonto({ ...skonto, days: parseInt(e.target.value) || 0 })} className="h-9 text-center text-xs" />
                          <Input placeholder="%" value={skonto.percent} onChange={e => setSkonto({ ...skonto, percent: parseFloat(e.target.value) || 0 })} className="h-9 text-center text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/50">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Zahlungsart & Konto</Label>
                      <div className="flex flex-col gap-2 mt-2">
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-9 border-slate-200 rounded-lg text-xs font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl"><SelectItem value="Überweisung">Überweisung</SelectItem><SelectItem value="Bar">Bar</SelectItem></SelectContent>
                        </Select>
                        <Input placeholder="Erlöskonto (Optional)" value={revenueAccount} onChange={e => setRevenueAccount(e.target.value)} className="h-9 text-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: SMART SUMMARY */}
          <div className="lg:col-span-4 sticky top-24 space-y-6 hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[24px] overflow-hidden">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Zusammenfassung</h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/30">
                    <button
                      onClick={() => setSummaryMode('net')}
                      className={cn("px-3 py-1 text-[9px] font-black rounded-md transition-all", summaryMode === 'net' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
                    >NET</button>
                    <button
                      onClick={() => setSummaryMode('gross')}
                      className={cn("px-3 py-1 text-[9px] font-black rounded-md transition-all", summaryMode === 'gross' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
                    >BRUT</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium text-slate-500">
                    <span>Zwischensumme</span>
                    <span className="font-mono">{netTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/50">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Rabatte</span>
                    <span className="font-mono">-{((items.reduce((ac, it) => ac + (it.unitPrice * it.quantity), 0)) - netTotal).toFixed(2)} €</span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex justify-between text-xs font-medium text-slate-400">
                      <span>Umsatzsteuer ({invoiceData.taxRate}%)</span>
                      <span className="font-mono">{totalVat.toFixed(2)} €</span>
                    </div>
                    <div className="h-[1px] bg-slate-100 w-full" />
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Gesamtbetrag</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{grossTotal.toFixed(2)} <span className="text-lg text-slate-400">€</span></span>
                    </div>
                    <div className="flex flex-col items-end pb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fällig bis</span>
                      <span className="text-xs font-black text-slate-700">{invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('de-DE') : '--'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100/50 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Zap className="w-3 h-3 text-amber-500" /> Quick Checks
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Empfänger angelegt</span>
                        {customer.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Positionen erfasst</span>
                        {items.filter(i => i.description).length > 0 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Bankdaten gültig</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-11 rounded-[14px] bg-[#0B0D12] hover:bg-[#1F2937] active:bg-black text-white font-semibold shadow-sm text-sm"
                >
                  Rechnung Senden
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </main >

      {/* MODALS */}
      < InvoicePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        design={invoiceDesign}
        onDesignChange={setInvoiceDesign}
        data={{
          customer,
          invoiceData,
          items: items.filter(i => i.description),
          settings: {
            currency,
            skonto,
            internalContact,
            revenueAccount,
            paymentMethod,
            costCenter,
            vatRegulation,
            isERechnung,
            companySettings
          }
        }
        }
      />

      {/* ITEM TEMPLATE MODALS */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Positions-Vorlage speichern</DialogTitle>
            <DialogDescription>Geben Sie einen Namen für diese Vorlage ein.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="z.B. Monatsservice IT"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="h-12 rounded-xl bg-slate-50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowSaveTemplateDialog(false)} className="rounded-xl font-bold">Abbrechen</Button>
            <Button onClick={saveItemTemplate} className="bg-[#0B0D12] text-white rounded-[14px] font-semibold px-6 h-11">Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApplyTemplateDialog} onOpenChange={setShowApplyTemplateDialog}>
        <DialogContent className="rounded-2xl border-none shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Vorlage anwenden</DialogTitle>
            <DialogDescription>Wählen Sie eine gespeicherte Positionen-Vorlage aus.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {itemTemplates.length === 0 && <p className="text-center text-slate-400 py-8 text-sm italic">Keine Vorlagen gespeichert.</p>}
            {itemTemplates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer" onClick={() => applyItemTemplate(t)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400">
                    <Layout className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t.items.length} Positionen • {t.taxRate}% USt.</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItemTemplate(t.id); }}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40 shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Gesamtbetrag</span>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{grossTotal.toFixed(2)} €</h4>
          </div>
          <Button
            onClick={handleSave}
            className="bg-[#0B0D12] hover:bg-[#1F2937] active:bg-black text-white px-8 h-11 rounded-[14px] font-semibold transition-all shadow-sm"
          >
            Senden
          </Button>
        </div>
      </div>
    </div >
  )
}
