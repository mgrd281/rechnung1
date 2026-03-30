'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, ArrowLeft, Save, Plus } from 'lucide-react'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { BackButton } from '@/components/navigation/back-button'

interface NewOrganization {
  name: string
  address: string
  zipCode: string
  city: string
  country: string
  taxId: string
  bankName: string
  iban: string
  bic: string
  website: string
  phone: string
  email: string
}

export default function NewOrganizationPage() {
  const { navigate } = useSafeNavigation()
  const [organization, setOrganization] = useState<NewOrganization>({
    name: '',
    address: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    taxId: '',
    bankName: '',
    iban: '',
    bic: '',
    website: '',
    phone: '',
    email: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    // Validate required fields
    if (!organization.name || !organization.taxId) {
      alert('Bitte füllen Sie mindestens Firmenname und Steuer-ID aus.')
      return
    }

    setSaving(true)
    try {
      // In a real app, you'd send POST request to /api/organizations
      console.log('Creating new organization:', organization)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('Organisation erfolgreich erstellt!')
      // Redirect back to organizations page
      navigate('/organizations')

    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Fehler beim Erstellen der Organisation')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof NewOrganization, value: string) => {
    setOrganization(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <HeaderNavIcons />
              <div className="mx-1" />
              <Building2 className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Neue Organisation erstellen
              </h1>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Organisation erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Grundinformationen</CardTitle>
              <CardDescription>
                Grundlegende Daten der neuen Organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* s */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmenname *
                  </label>
                  <Input
                    value={organization.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Muster GmbH"
                    required
                    className="w-full"
                  />
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Steuerliche Identifikationsnummer *
                  </label>
                  <Input
                    value={organization.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="DE123456789"
                    required
                    className="w-full"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={organization.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.beispiel.de"
                    className="w-full"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefonnummer
                  </label>
                  <Input
                    type="tel"
                    value={organization.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+49 123 456789"
                    className="w-full"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse
                  </label>
                  <Input
                    type="email"
                    value={organization.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@beispiel.de"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Adressinformationen</CardTitle>
              <CardDescription>
                Geschäftsadresse der Organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Straße und Hausnummer
                  </label>
                  <Input
                    value={organization.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Geschäftsstraße 123"
                    className="w-full"
                  />
                </div>

                {/* ZIP Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postleitzahl
                  </label>
                  <Input
                    value={organization.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="12345"
                    className="w-full"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stadt
                  </label>
                  <Input
                    value={organization.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Berlin"
                    className="w-full"
                  />
                </div>

                {/* Country */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land
                  </label>
                  <select
                    value={organization.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Land auswählen"
                  >
                    <option value="Deutschland">Deutschland</option>
                    <option value="Österreich">Österreich</option>
                    <option value="Schweiz">Schweiz</option>
                    <option value="Niederlande">Niederlande</option>
                    <option value="Belgien">Belgien</option>
                    <option value="Frankreich">Frankreich</option>
                    <option value="Italien">Italien</option>
                    <option value="Spanien">Spanien</option>
                    <option value="Andere">Andere</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardHeader>
              <CardTitle>Bankverbindung</CardTitle>
              <CardDescription>
                Bankdaten für Rechnungen und Überweisungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bankname
                  </label>
                  <Input
                    value={organization.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Deutsche Bank"
                    className="w-full"
                  />
                </div>

                {/* IBAN */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN
                  </label>
                  <Input
                    value={organization.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    className="w-full"
                  />
                </div>

                {/* BIC */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BIC/SWIFT-Code
                  </label>
                  <Input
                    value={organization.bic}
                    onChange={(e) => handleInputChange('bic', e.target.value)}
                    placeholder="COBADEFFXXX"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/organizations">
              <Button variant="outline">
                Abbrechen
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstellen...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Organisation erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
