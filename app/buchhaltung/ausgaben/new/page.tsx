'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState } from 'react'
import { BackButton } from '@/components/navigation/back-button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload, Calculator } from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ExpenseCategory, getExpenseCategoryLabel, DATEV_ACCOUNTS } from '@/lib/accounting-types'

interface ExpenseFormData {
  date: string
  category: ExpenseCategory
  description: string
  supplier: string
  supplierTaxId: string
  netAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  receiptFile: File | null
  accountingAccount: string
  costCenter: string
  bookingText: string
}

export default function NewExpensePage() {
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: 'office',
    description: '',
    supplier: '',
    supplierTaxId: '',
    netAmount: 0,
    taxRate: 19,
    taxAmount: 0,
    totalAmount: 0,
    receiptFile: null,
    accountingAccount: DATEV_ACCOUNTS.OFFICE_SUPPLIES,
    costCenter: 'ADMIN',
    bookingText: ''
  })

  const handleInputChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Auto-calculate amounts when net amount or tax rate changes
      if (field === 'netAmount' || field === 'taxRate') {
        const netAmount = field === 'netAmount' ? value : updated.netAmount
        const taxRate = field === 'taxRate' ? value : updated.taxRate

        updated.taxAmount = (netAmount * taxRate) / 100
        updated.totalAmount = netAmount + updated.taxAmount
      }

      // Auto-calculate net amount when total amount changes
      if (field === 'totalAmount') {
        const totalAmount = value
        const taxRate = updated.taxRate

        updated.netAmount = totalAmount / (1 + taxRate / 100)
        updated.taxAmount = totalAmount - updated.netAmount
      }

      // Auto-set accounting account based on category
      if (field === 'category') {
        const accountMap: { [key in ExpenseCategory]: string } = {
          'office': DATEV_ACCOUNTS.OFFICE_SUPPLIES,
          'travel': DATEV_ACCOUNTS.TRAVEL_EXPENSES,
          'equipment': DATEV_ACCOUNTS.EQUIPMENT,
          'marketing': DATEV_ACCOUNTS.MARKETING,
          'utilities': DATEV_ACCOUNTS.UTILITIES,
          'professional_services': DATEV_ACCOUNTS.PROFESSIONAL_SERVICES,
          'other': DATEV_ACCOUNTS.OFFICE_SUPPLIES
        }
        updated.accountingAccount = accountMap[value as ExpenseCategory]
      }

      // Auto-generate booking text
      if (field === 'description' || field === 'supplier') {
        updated.bookingText = `${updated.description} - ${updated.supplier}`.slice(0, 60)
      }

      return updated
    })
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', 'expense-receipt')

      const response = await authenticatedFetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (response.ok) {
        const result = await response.json()
        return result.url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Fehler beim Hochladen der Datei')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!formData.description || !formData.supplier || !formData.totalAmount) {
        alert('Bitte füllen Sie alle Pflichtfelder aus')
        return
      }

      let receiptUrl = null
      let receiptFileName = null

      // Upload receipt file if provided
      if (formData.receiptFile) {
        receiptUrl = await handleFileUpload(formData.receiptFile)
        if (!receiptUrl) {
          return // Upload failed
        }
        receiptFileName = formData.receiptFile.name
      }

      // Prepare expense data
      const expenseData = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        supplier: formData.supplier,
        supplierTaxId: formData.supplierTaxId,
        netAmount: formData.netAmount,
        taxRate: formData.taxRate,
        taxAmount: formData.taxAmount,
        totalAmount: formData.totalAmount,
        receiptUrl,
        receiptFileName,
        accountingAccount: formData.accountingAccount,
        costCenter: formData.costCenter,
        bookingText: formData.bookingText
      }

      // Save expense
      const response = await authenticatedFetch('/api/accounting/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      })

      if (response.ok) {
        alert('Ausgabe erfolgreich gespeichert!')
        router.push('/buchhaltung')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save expense')
      }

    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Fehler beim Speichern der Ausgabe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <HeaderNavIcons />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Calculator className="w-8 h-8 text-blue-600" />
              <span>Neue Ausgabe</span>
            </h1>
            <p className="text-gray-600">
              Betriebsausgabe für die Buchhaltung erfassen
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Grunddaten</CardTitle>
              <CardDescription>
                Grundlegende Informationen zur Ausgabe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Bürobedarf</SelectItem>
                      <SelectItem value="travel">Reisekosten</SelectItem>
                      <SelectItem value="equipment">Ausstattung</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="utilities">Nebenkosten</SelectItem>
                      <SelectItem value="professional_services">Beratung</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detaillierte Beschreibung der Ausgabe"
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lieferant</CardTitle>
              <CardDescription>
                Informationen zum Lieferanten/Dienstleister
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supplier">Lieferant/Dienstleister *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Name des Lieferanten"
                  required
                />
              </div>

              <div>
                <Label htmlFor="supplierTaxId">Steuernummer (optional)</Label>
                <Input
                  id="supplierTaxId"
                  value={formData.supplierTaxId}
                  onChange={(e) => handleInputChange('supplierTaxId', e.target.value)}
                  placeholder="DE123456789"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Beträge</CardTitle>
              <CardDescription>
                Netto-, Steuer- und Bruttobeträge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Bruttobetrag (€) *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', Number(e.target.value))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="taxRate">MwSt-Satz (%)</Label>
                  <Select
                    value={formData.taxRate.toString()}
                    onValueChange={(value) => handleInputChange('taxRate', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (steuerbefreit)</SelectItem>
                      <SelectItem value="7">7% (ermäßigt)</SelectItem>
                      <SelectItem value="19">19% (Regelsteuersatz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="netAmount">Nettobetrag (€)</Label>
                  <Input
                    id="netAmount"
                    type="number"
                    value={formData.netAmount.toFixed(2)}
                    onChange={(e) => handleInputChange('netAmount', Number(e.target.value))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Nettobetrag:</span>
                    <span>€{formData.netAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MwSt ({formData.taxRate}%):</span>
                    <span>€{formData.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Bruttobetrag:</span>
                    <span>€{formData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Beleg</CardTitle>
              <CardDescription>
                Rechnung oder Quittung hochladen (PDF, JPG, PNG)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="receipt">Beleg-Datei</Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      handleInputChange('receiptFile', file)
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unterstützte Formate: PDF, JPG, PNG (max. 10MB)
                  </p>
                </div>

                {formData.receiptFile && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-800">
                      Datei ausgewählt: {formData.receiptFile.name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & DATEV */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Kategorie:</span>
                  <span className="font-medium">{getExpenseCategoryLabel(formData.category)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lieferant:</span>
                  <span className="font-medium">{formData.supplier || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Datum:</span>
                  <span className="font-medium">
                    {formData.date ? new Date(formData.date).toLocaleDateString('de-DE') : '-'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-lg font-bold text-center">
                  €{formData.totalAmount.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 text-center">Gesamtbetrag</p>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !formData.description || !formData.supplier || !formData.totalAmount}
                className="w-full"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Ausgabe speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* DATEV Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">DATEV-Zuordnung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label htmlFor="accountingAccount">Sachkonto</Label>
                <Input
                  id="accountingAccount"
                  value={formData.accountingAccount}
                  onChange={(e) => handleInputChange('accountingAccount', e.target.value)}
                  placeholder="6815"
                />
              </div>

              <div>
                <Label htmlFor="costCenter">Kostenstelle</Label>
                <Input
                  id="costCenter"
                  value={formData.costCenter}
                  onChange={(e) => handleInputChange('costCenter', e.target.value)}
                  placeholder="ADMIN"
                />
              </div>

              <div>
                <Label htmlFor="bookingText">Buchungstext</Label>
                <Input
                  id="bookingText"
                  value={formData.bookingText}
                  onChange={(e) => handleInputChange('bookingText', e.target.value)}
                  placeholder="Automatisch generiert"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max. 60 Zeichen für DATEV
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
