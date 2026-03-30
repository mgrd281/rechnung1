'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, ArrowLeft, Save, Plus, Building2, User, Upload, FileText, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { BackButton } from '@/components/navigation/back-button'

interface NewCustomer {
  name: string
  email: string
  phone: string
  address: string
  zipCode: string
  city: string
  country: string
  taxId: string
  notes: string
  type: 'PRIVATE' | 'BUSINESS'
  status: 'ACTIVE' | 'NEW' | 'INACTIVE' | 'VIP'
  deliveryAddress: string
  deliveryZip: string
  deliveryCity: string
  deliveryCountry: string
  tags: string[]
}

export default function NewCustomerPage() {
  const { navigate } = useSafeNavigation()
  const [customer, setCustomer] = useState<NewCustomer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    taxId: '',
    notes: '',
    type: 'PRIVATE',
    status: 'NEW',
    deliveryAddress: '',
    deliveryZip: '',
    deliveryCity: '',
    deliveryCountry: 'Deutschland',
    tags: []
  })

  const [sameAddress, setSameAddress] = useState(true)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const { showToast } = useToast()

  // Calculate progress based on filled fields
  useEffect(() => {
    let filled = 0
    const total = 7 // Key fields
    if (customer.name) filled++
    if (customer.email) filled++
    if (customer.address) filled++
    if (customer.zipCode) filled++
    if (customer.city) filled++
    if (customer.type === 'BUSINESS' && customer.taxId) filled++
    else if (customer.type === 'PRIVATE') filled++ // Bonus for private not needing taxId
    if (customer.phone) filled++

    setProgress(Math.min(100, Math.round((filled / total) * 100)))
  }, [customer])

  const handleSave = async () => {
    // Validation
    if (!customer.name.trim()) {
      showToast('Bitte geben Sie einen Namen ein.', 'error')
      return
    }
    if (!customer.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showToast('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error')
      return
    }
    if (customer.type === 'BUSINESS' && !customer.taxId) {
      showToast('Für Geschäftskunden ist eine Steuer-ID erforderlich.', 'error')
      return
    }

    setSaving(true)
    try {
      // Prepare data (handle delivery address)
      const dataToSend = {
        ...customer,
        deliveryAddress: sameAddress ? customer.address : customer.deliveryAddress,
        deliveryZip: sameAddress ? customer.zipCode : customer.deliveryZip,
        deliveryCity: sameAddress ? customer.city : customer.deliveryCity,
        deliveryCountry: sameAddress ? customer.country : customer.deliveryCountry,
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (data.success) {
        showToast('Kunde erfolgreich erstellt!', 'success')
        setTimeout(() => {
          navigate('/customers')
        }, 1000)
      } else {
        showToast(data.error || 'Fehler beim Erstellen', 'error')
      }
    } catch (error) {
      showToast('Verbindungsfehler beim Speichern.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof NewCustomer, value: any) => {
    setCustomer(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24"> {/* Added padding-bottom for sticky footer */}
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30 backdrop-blur-xl bg-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <HeaderNavIcons />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Neuen Kunden erstellen</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={cn("flex items-center gap-1", progress === 100 ? "text-green-600" : "")}>
                    {progress === 100 ? <CheckCircle2 className="h-3 w-3" /> : null}
                    {progress}% Vollständig
                  </span>
                  <Progress value={progress} className="w-24 h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Customer Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kundentyp</CardTitle>
                <CardDescription>Handelt es sich um eine Privatperson oder ein Unternehmen?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  defaultValue="PRIVATE"
                  value={customer.type}
                  onValueChange={(val) => handleInputChange('type', val)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="PRIVATE" id="private" className="peer sr-only" />
                    <Label
                      htmlFor="private"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer transition-all"
                    >
                      <User className="mb-3 h-6 w-6" />
                      Privatkunde
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="BUSINESS" id="business" className="peer sr-only" />
                    <Label
                      htmlFor="business"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer transition-all"
                    >
                      <Building2 className="mb-3 h-6 w-6" />
                      Geschäftskunde
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Grundinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Name / Firmenname *</Label>
                    <Input
                      value={customer.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={customer.type === 'BUSINESS' ? "Beispiel GmbH" : "Max Mustermann"}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>E-Mail-Adresse *</Label>
                    <Input
                      type="email"
                      value={customer.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="kontakt@beispiel.de"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Telefonnummer</Label>
                    <Input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+49 123 456789"
                      className="mt-1.5"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Format: +49...</p>
                  </div>

                  {customer.type === 'BUSINESS' && (
                    <div className="md:col-span-2">
                      <Label>USt-IdNr. / Steuer-ID *</Label>
                      <Input
                        value={customer.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        placeholder="DE123456789"
                        className="mt-1.5"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Rechnungsadresse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Straße & Hausnummer</Label>
                    <Input
                      value={customer.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Musterstraße 1"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Postleitzahl</Label>
                    <Input
                      value={customer.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="12345"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Stadt</Label>
                    <Input
                      value={customer.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Berlin"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Land</Label>
                    <Select value={customer.country} onValueChange={(val) => handleInputChange('country', val)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Land wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deutschland">Deutschland</SelectItem>
                        <SelectItem value="Österreich">Österreich</SelectItem>
                        <SelectItem value="Schweiz">Schweiz</SelectItem>
                        <SelectItem value="Niederlande">Niederlande</SelectItem>
                        {/* Add more countries as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Lieferadresse</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAddress"
                      checked={sameAddress}
                      onCheckedChange={(checked) => setSameAddress(checked as boolean)}
                    />
                    <Label htmlFor="sameAddress" className="font-normal cursor-pointer">
                      Identisch mit Rechnungsadresse
                    </Label>
                  </div>
                </div>
              </CardHeader>
              {!sameAddress && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="md:col-span-2">
                      <Label>Straße & Hausnummer (Lieferung)</Label>
                      <Input
                        value={customer.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>PLZ</Label>
                      <Input
                        value={customer.deliveryZip}
                        onChange={(e) => handleInputChange('deliveryZip', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Stadt</Label>
                      <Input
                        value={customer.deliveryCity}
                        onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Land</Label>
                      <Select value={customer.deliveryCountry} onValueChange={(val) => handleInputChange('deliveryCountry', val)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Land wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Deutschland">Deutschland</SelectItem>
                          <SelectItem value="Österreich">Österreich</SelectItem>
                          <SelectItem value="Schweiz">Schweiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={customer.status} onValueChange={(val) => handleInputChange('status', val)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">Neu</SelectItem>
                      <SelectItem value="ACTIVE">Aktiv</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags</Label>
                  <Input
                    placeholder="z.B. B2B, Großkunde (Komma getrennt)"
                    className="mt-1.5"
                    value={customer.tags.join(', ')}
                    onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()))}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Tags helfen beim Filtern von Kunden.</p>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Dokumente</CardTitle>
                <CardDescription>Laden Sie Verträge oder Nachweise hoch.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Datei auswählen</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG bis 10MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Interne Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customer.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notizen nur für Mitarbeiter sichtbar..."
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Sticky Footer Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <div className="text-sm text-gray-500 hidden sm:block">
            {customer.name ? <span>Erstelle Kunde: <b>{customer.name}</b></span> : 'Neuer Kunde wird erstellt...'}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Link href="/customers">
              <Button variant="outline">Abbrechen</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Kunde erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      
    </div>
  )
}
