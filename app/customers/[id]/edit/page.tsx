'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, ArrowLeft, Save, Building2, User, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuthenticatedFetch } from '@/lib/api-client'

interface CustomerData {
  id: string
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

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const { showToast } = useToast()

  const [customer, setCustomer] = useState<CustomerData>({
    id: '',
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
    status: 'ACTIVE',
    deliveryAddress: '',
    deliveryZip: '',
    deliveryCity: '',
    deliveryCountry: 'Deutschland',
    tags: []
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sameAddress, setSameAddress] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await authenticatedFetch(`/api/customers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer({
          ...data,
          tags: data.tags || [],
          type: data.type || 'PRIVATE',
          status: data.status || 'ACTIVE',
          deliveryCountry: data.deliveryCountry || 'Deutschland'
        })

        // Check if delivery address is same as billing
        if (data.deliveryAddress && data.deliveryAddress !== data.address) {
          setSameAddress(false)
        } else {
          setSameAddress(true)
        }
      } else {
        showToast('Fehler beim Laden des Kunden', 'error')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      showToast('Verbindungsfehler', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!customer.name || !customer.email) {
      showToast('Name und E-Mail sind Pflichtfelder', 'error')
      return
    }

    setSaving(true)
    try {
      const dataToSend = {
        ...customer,
        deliveryAddress: sameAddress ? customer.address : customer.deliveryAddress,
        deliveryZip: sameAddress ? customer.zipCode : customer.deliveryZip,
        deliveryCity: sameAddress ? customer.city : customer.deliveryCity,
        deliveryCountry: sameAddress ? customer.country : customer.deliveryCountry,
      }

      const response = await authenticatedFetch(`/api/customers?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (data.success) {
        showToast('Kunde erfolgreich aktualisiert!', 'success')
        setTimeout(() => {
          router.push('/customers')
        }, 1000)
      } else {
        showToast(data.error || 'Fehler beim Speichern', 'error')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      showToast('Fehler beim Speichern', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CustomerData, value: any) => {
    setCustomer(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30 backdrop-blur-xl bg-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/customers">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kunde bearbeiten</h1>
                <p className="text-sm text-gray-500">{customer.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Customer Type */}
            <Card>
              <CardHeader>
                <CardTitle>Kundentyp</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
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
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>E-Mail-Adresse *</Label>
                    <Input
                      type="email"
                      value={customer.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Telefonnummer</Label>
                    <Input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  {customer.type === 'BUSINESS' && (
                    <div className="md:col-span-2">
                      <Label>USt-IdNr. / Steuer-ID</Label>
                      <Input
                        value={customer.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
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
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Postleitzahl</Label>
                    <Input
                      value={customer.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Stadt</Label>
                    <Input
                      value={customer.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
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
                    placeholder="z.B. B2B, Großkunde"
                    className="mt-1.5"
                    value={customer.tags.join(', ')}
                    onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()))}
                  />
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
            Bearbeite Kunde: <b>{customer.name}</b>
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
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      
    </div>
  )
}
