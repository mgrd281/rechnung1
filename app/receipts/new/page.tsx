'use client'

import { useState, useEffect } from 'react'
import { BackButton } from '@/components/navigation/back-button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Receipt, Save, Eye, ArrowLeft } from 'lucide-react'
import { DocumentTemplate, getTemplatesByType } from '@/lib/document-templates'

interface ReceiptItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface ReceiptData {
  receiptNumber: string
  date: string
  customerName: string
  customerEmail: string
  customerAddress: string
  paymentMethod: string
  referenceNumber: string
  items: ReceiptItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes: string
  paidAmount: number
  remainingAmount: number
}

export default function NewReceiptPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  const [receiptData, setReceiptData] = useState<ReceiptData>({
    receiptNumber: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ],
    subtotal: 0,
    taxRate: 19,
    taxAmount: 0,
    totalAmount: 0,
    notes: '',
    paidAmount: 0,
    remainingAmount: 0
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [receiptData.items, receiptData.taxRate, receiptData.paidAmount])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const receiptTemplates = getTemplatesByType('receipt')
      setTemplates(receiptTemplates)

      // Select default template
      const defaultTemplate = receiptTemplates.find(t => t.isDefault)
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const subtotal = receiptData.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = (subtotal * receiptData.taxRate) / 100
    const totalAmount = subtotal + taxAmount
    const remainingAmount = Math.max(0, totalAmount - receiptData.paidAmount)

    setReceiptData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount,
      remainingAmount
    }))
  }

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
    setReceiptData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (itemId: string) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const updateItem = (itemId: string, field: keyof ReceiptItem, value: any) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save receipt
      console.log('Saving receipt:', { receiptData, template: selectedTemplate })

      // For now, just show success and redirect
      alert('Quittung erfolgreich gespeichert!')
      router.push('/receipts')
    } catch (error) {
      console.error('Error saving receipt:', error)
      alert('Fehler beim Speichern der Quittung')
    }
  }

  const handlePreview = () => {
    // TODO: Implement PDF preview
    console.log('Preview receipt:', { receiptData, template: selectedTemplate })
    alert('PDF-Vorschau kommt bald')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Laden...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <BackButton fallbackUrl="/dashboard" variant="outline" className="flex items-center space-x-2" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Neue Empfangsbestätigung
            </h1>
            <p className="text-gray-600">
              Erstellen Sie eine offizielle Zahlungsbestätigung
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Vorlagenauswahl</CardTitle>
              <CardDescription>
                Wählen Sie die passende Empfangsbestätigungsvorlage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Quittungsvorlage
                </Label>
                <Select
                  value={selectedTemplate?.id || ''}
                  onValueChange={(value) => {
                    const template = templates.find(t => t.id === value)
                    setSelectedTemplate(template || null)
                  }}
                >
                  <SelectTrigger className="h-10 border border-gray-300 hover:border-gray-400 focus:border-blue-500 flex items-center">
                    <SelectValue placeholder="Vorlage auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id} className="py-2">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center flex-1">
                            <div className="w-2 h-2 rounded-full mr-3 bg-green-500"></div>
                            <div className="flex items-center">
                              <span className="font-medium text-sm">{template.name}</span>
                              {template.isDefault && (
                                <span className="ml-2 text-xs text-blue-600 font-medium">Standard</span>
                              )}
                            </div>
                          </div>
                          <Badge className="ml-3 text-xs bg-green-100 text-green-700">
                            Receipt
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ausgewählt: <span className="font-medium">{selectedTemplate.name}</span></span>
                      <Badge className="text-xs bg-green-100 text-green-700">
                        {selectedTemplate.content.title}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receipt Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quittungsdetails</CardTitle>
              <CardDescription>
                Grundlegende Informationen für die Empfangsbestätigung
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiptNumber">Quittungsnummer</Label>
                <Input
                  id="receiptNumber"
                  value={receiptData.receiptNumber}
                  onChange={(e) => setReceiptData({ ...receiptData, receiptNumber: e.target.value })}
                  placeholder="REC-2025-001"
                />
              </div>
              <div>
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={receiptData.date}
                  onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Zahlungsmethode</Label>
                <Select
                  value={receiptData.paymentMethod}
                  onValueChange={(value) => setReceiptData({ ...receiptData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                    <SelectItem value="cash">Bargeld</SelectItem>
                    <SelectItem value="credit_card">Kreditkarte</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="check">Scheck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="referenceNumber">Referenznummer</Label>
                <Input
                  id="referenceNumber"
                  value={receiptData.referenceNumber}
                  onChange={(e) => setReceiptData({ ...receiptData, referenceNumber: e.target.value })}
                  placeholder="REF-123456"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Kundeninformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Kundenname</Label>
                <Input
                  id="customerName"
                  value={receiptData.customerName}
                  onChange={(e) => setReceiptData({ ...receiptData, customerName: e.target.value })}
                  placeholder="Vollständiger Name des Kunden"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">E-Mail</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={receiptData.customerEmail}
                  onChange={(e) => setReceiptData({ ...receiptData, customerEmail: e.target.value })}
                  placeholder="kunde@beispiel.de"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Adresse</Label>
                <Textarea
                  id="customerAddress"
                  value={receiptData.customerAddress}
                  onChange={(e) => setReceiptData({ ...receiptData, customerAddress: e.target.value })}
                  placeholder="Vollständige Kundenadresse"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Positionen</span>
                <Button onClick={addItem} size="sm" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Position hinzufügen</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receiptData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label>Beschreibung</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Beschreibung der Leistung oder des Produkts"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Menge</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Preis</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Summe</Label>
                      <Input
                        type="number"
                        value={item.total.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="col-span-1">
                      {receiptData.items.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Zahlungsinformationen</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paidAmount">Gezahlter Betrag</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={receiptData.paidAmount}
                  onChange={(e) => setReceiptData({ ...receiptData, paidAmount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Steuersatz (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={receiptData.taxRate}
                  onChange={(e) => setReceiptData({ ...receiptData, taxRate: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Anmerkungen</Label>
                <Textarea
                  id="notes"
                  value={receiptData.notes}
                  onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
                  placeholder="Zusätzliche Anmerkungen zur Zahlung"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>Zusammenfassung</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Zwischensumme:</span>
                  <span className="font-medium">€{receiptData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MwSt. ({receiptData.taxRate}%):</span>
                  <span className="font-medium">€{receiptData.taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Gesamtbetrag:</span>
                  <span>€{receiptData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Gezahlt:</span>
                  <span>€{receiptData.paidAmount.toFixed(2)}</span>
                </div>
                {receiptData.remainingAmount > 0 && (
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Restbetrag:</span>
                    <span>€{receiptData.remainingAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Button onClick={handleSave} className="w-full flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Quittung speichern</span>
                </Button>
                <Button onClick={handlePreview} variant="outline" className="w-full flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>PDF-Vorschau</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Info */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vorlageninfo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Typ:</span>
                  <Badge className="ml-2 text-xs bg-green-100 text-green-700">
                    {selectedTemplate.content.title}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Kategorie:</span>
                  <span className="ml-2 text-gray-600">{selectedTemplate.category}</span>
                </div>
                {selectedTemplate.content.subtitle && (
                  <div>
                    <span className="font-medium">Beschreibung:</span>
                    <p className="text-gray-600 text-xs mt-1">{selectedTemplate.content.subtitle}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
