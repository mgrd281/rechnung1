'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { BackButton } from '@/components/navigation/back-button'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft, Save, Eye, X, FileX } from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/api-client'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerAddress: string
  date: string
  dueDate: string
  status: string
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes?: string
}

interface CancellationData {
  cancellationNumber: string
  cancellationDate: string
  reason: string
  refundMethod: string
  refundAmount: number
  notes: string
  notifyCustomer: boolean
}

export default function CancelInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const authenticatedFetch = useAuthenticatedFetch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null)

  const [cancellationData, setCancellationData] = useState<CancellationData>({
    cancellationNumber: `STORNO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    cancellationDate: new Date().toISOString().split('T')[0],
    reason: '',
    refundMethod: 'bank_transfer',
    refundAmount: 0,
    notes: '',
    notifyCustomer: true
  })

  useEffect(() => {
    if (params.id) {
      loadOriginalInvoice(params.id as string)
    }
  }, [params.id])

  const loadOriginalInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`/api/invoices/${invoiceId}`)

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Loaded invoice data:', data) // Debug logging

        if (data && !data.error) {
          // Normalize data to match interface
          const normalizedInvoice: Invoice = {
            id: data.id,
            invoiceNumber: data.number || data.invoiceNumber,
            customerName: data.customer?.name || data.customerName || 'Unbekannt',
            customerEmail: data.customer?.email || data.customerEmail || '',
            customerAddress: data.customer?.address || data.customerAddress || '',
            date: data.date,
            dueDate: data.dueDate,
            status: data.status,
            items: data.items || [],
            subtotal: data.subtotal || 0,
            taxRate: data.taxRate || 19,
            taxAmount: data.taxAmount || 0,
            totalAmount: data.totalAmount || data.total || 0,
            notes: data.notes
          }

          setOriginalInvoice(normalizedInvoice)

          // Set refund amount to original total
          const totalAmount = normalizedInvoice.totalAmount
          console.log('💰 Setting refund amount:', totalAmount)

          setCancellationData(prev => ({
            ...prev,
            refundAmount: totalAmount
          }))
        } else {
          console.error('Invalid invoice data structure or error:', data)
          alert('Fehler: Ungültige Rechnungsdaten / Error: Invalid invoice data')
          router.push(`/invoices/${params.id}`)
        }
      } else {
        console.error('Failed to load invoice')
        alert('Fehler beim Laden der Rechnung / Error loading invoice')
        router.push(`/invoices/${params.id}`)
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
      alert('Fehler beim Laden der Rechnung / Error loading invoice')
      router.push(`/invoices/${params.id}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCancellation = async () => {
    if (!originalInvoice) return

    try {
      setSaving(true)

      const response = await authenticatedFetch(`/api/invoices/${originalInvoice.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancellationData.reason,
          processingNotes: cancellationData.notes,
          cancellationNumber: cancellationData.cancellationNumber,
          date: cancellationData.cancellationDate,
          refundMethod: cancellationData.refundMethod,
          // We don't pass refundAmount as the API calculates it based on the original invoice
          // to ensure data consistency for a full cancellation.
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('Storno-Rechnung erfolgreich erstellt! / Cancellation invoice created successfully!')
          router.push('/invoices')
        } else {
          throw new Error(result.error || 'Failed to create cancellation invoice')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create cancellation invoice')
      }
    } catch (error) {
      console.error('Error creating cancellation:', error)
      alert(`Fehler beim Erstellen der Storno-Rechnung: ${(error as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    // TODO: Implement PDF preview for cancellation invoice
    alert('PDF-Vorschau für Storno-Rechnung kommt bald / PDF preview for cancellation invoice coming soon')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Rechnung wird geladen... / Loading invoice...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!originalInvoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rechnung nicht gefunden</h1>
          <p className="text-gray-600 mb-4">Die angeforderte Rechnung konnte nicht gefunden werden.</p>
          <Button onClick={() => router.push('/invoices')}>Zurück</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <HeaderNavIcons />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <FileX className="w-8 h-8 text-red-500" />
              <span>Storno-Rechnung erstellen</span>
            </h1>
            <p className="text-gray-600">
              Erstellen Sie eine Storno-Rechnung für Rechnung {originalInvoice.invoiceNumber?.startsWith('#') ? originalInvoice.invoiceNumber : `#${originalInvoice.invoiceNumber}`}
            </p>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Wichtiger Hinweis / Important Notice</h3>
              <p className="text-sm text-red-700 mt-1">
                Diese Aktion erstellt eine Storno-Rechnung und setzt die ursprüngliche Rechnung auf "Storniert".
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <p className="text-sm text-red-700 mt-1">
                This action creates a cancellation invoice and sets the original invoice to "Cancelled".
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Original Invoice Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileX className="w-5 h-5 text-blue-500" />
                <span>Ursprüngliche Rechnung / Original Invoice</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Rechnungsnummer</Label>
                <p className="font-medium">{originalInvoice.invoiceNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Kunde</Label>
                <p className="font-medium">{originalInvoice.customerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Datum</Label>
                <p className="font-medium">{new Date(originalInvoice.date).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={`${originalInvoice.status === 'Bezahlt' ? 'bg-green-100 text-green-800' :
                  originalInvoice.status === 'Offen' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {originalInvoice.status}
                </Badge>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-gray-500">Gesamtbetrag</Label>
                <p className="text-lg font-bold text-gray-900">€{originalInvoice.totalAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rechnungsposten / Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {originalInvoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate">{item.description}</span>
                    <span className="font-medium">€{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Cancellation Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storno-Details / Cancellation Details</CardTitle>
              <CardDescription>
                Geben Sie die Details für die Stornierung ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cancellationNumber">Storno-Nummer / Cancellation Number</Label>
                <Input
                  id="cancellationNumber"
                  value={cancellationData.cancellationNumber}
                  onChange={(e) => setCancellationData({
                    ...cancellationData,
                    cancellationNumber: e.target.value
                  })}
                  placeholder="STORNO-2025-001"
                />
              </div>

              <div>
                <Label htmlFor="cancellationDate">Storno-Datum / Cancellation Date</Label>
                <Input
                  id="cancellationDate"
                  type="date"
                  value={cancellationData.cancellationDate}
                  onChange={(e) => setCancellationData({
                    ...cancellationData,
                    cancellationDate: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="reason">Grund der Stornierung / Reason for Cancellation</Label>
                <Select
                  value={cancellationData.reason}
                  onValueChange={(value) => setCancellationData({
                    ...cancellationData,
                    reason: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Grund auswählen / Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_request">Kundenwunsch / Customer Request</SelectItem>
                    <SelectItem value="error_in_invoice">Fehler in Rechnung / Error in Invoice</SelectItem>
                    <SelectItem value="duplicate">Duplikat / Duplicate</SelectItem>
                    <SelectItem value="service_not_delivered">Leistung nicht erbracht / Service Not Delivered</SelectItem>
                    <SelectItem value="payment_issues">Zahlungsprobleme / Payment Issues</SelectItem>
                    <SelectItem value="other">Sonstiges / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="refundMethod">Erstattungsmethode / Refund Method</Label>
                <Select
                  value={cancellationData.refundMethod}
                  onValueChange={(value) => setCancellationData({
                    ...cancellationData,
                    refundMethod: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Banküberweisung / Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Kreditkarte / Credit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="cash">Bar / Cash</SelectItem>
                    <SelectItem value="credit_note">Gutschrift / Credit Note</SelectItem>
                    <SelectItem value="no_refund">Keine Erstattung / No Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="refundAmount">Erstattungsbetrag / Refund Amount (€)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  value={cancellationData.refundAmount}
                  onChange={(e) => setCancellationData({
                    ...cancellationData,
                    refundAmount: Number(e.target.value)
                  })}
                  min="0"
                  max={originalInvoice.totalAmount}
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: €{originalInvoice.totalAmount.toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Interne Notizen / Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={cancellationData.notes}
                  onChange={(e) => setCancellationData({
                    ...cancellationData,
                    notes: e.target.value
                  })}
                  placeholder="Zusätzliche Informationen zur Stornierung..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Storno-Zusammenfassung / Cancellation Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ursprünglicher Betrag:</span>
                  <span className="font-medium">€{originalInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Storno-Betrag:</span>
                  <span className="font-medium">-€{originalInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Erstattung:</span>
                  <span className="text-green-600">€{cancellationData.refundAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button
                  onClick={handleSaveCancellation}
                  disabled={saving || !cancellationData.reason}
                  className="w-full flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving ? 'Wird erstellt...' : 'Storno-Rechnung erstellen'}
                  </span>
                </Button>

                <Button
                  onClick={handlePreview}
                  variant="outline"
                  className="w-full flex items-center space-x-2"
                  disabled={!cancellationData.reason}
                >
                  <Eye className="w-4 h-4" />
                  <span>Vorschau / Preview</span>
                </Button>
              </div>

              {!cancellationData.reason && (
                <p className="text-xs text-red-600 text-center">
                  Bitte wählen Sie einen Grund für die Stornierung aus.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Process Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Was passiert? / What happens?</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2">
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span>Storno-Rechnung mit negativen Beträgen wird erstellt</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span>Ursprüngliche Rechnung wird als "Storniert" markiert</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span>Kunde wird über die Stornierung informiert (optional)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                <span>Erstattung wird gemäß gewählter Methode verarbeitet</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
