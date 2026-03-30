'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, ArrowLeft, Save, Settings, FileText, Mail, Palette } from 'lucide-react'

interface OrganizationSettings {
  id: string
  name: string
  invoicePrefix: string
  invoiceNumberStart: number
  defaultTaxRate: number
  invoiceTemplate: string
  logoUrl: string
  primaryColor: string
  emailSignature: string
  paymentTerms: number
  currency: string
  language: string
}

export default function OrganizationSettingsPage({ params }: { params: { id: string } }) {
  const [settings, setSettings] = useState<OrganizationSettings>({
    id: '',
    name: '',
    invoicePrefix: 'RE',
    invoiceNumberStart: 1,
    defaultTaxRate: 19,
    invoiceTemplate: 'standard',
    logoUrl: '',
    primaryColor: '#2563eb',
    emailSignature: '',
    paymentTerms: 14,
    currency: 'EUR',
    language: 'de'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [params.id])

  const fetchSettings = async () => {
    try {
      // Mock data - in a real app, you'd fetch from /api/organizations/[id]/settings
      const mockSettings: OrganizationSettings = {
        id: params.id,
        name: 'Muster GmbH',
        invoicePrefix: 'RE',
        invoiceNumberStart: 1,
        defaultTaxRate: 19,
        invoiceTemplate: 'standard',
        logoUrl: '',
        primaryColor: '#2563eb',
        emailSignature: 'Mit freundlichen Grüßen\nIhr Team von Muster GmbH',
        paymentTerms: 14,
        currency: 'EUR',
        language: 'de'
      }

      setSettings(mockSettings)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real app, you'd send PUT request to /api/organizations/[id]/settings
      console.log('Saving settings:', settings)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('Einstellungen erfolgreich gespeichert!')

    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof OrganizationSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Einstellungen werden geladen...</p>
        </div>
      </div>
    )
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
              <Settings className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Einstellungen
                </h1>
                <p className="text-sm text-gray-600">
                  {settings.name}
                </p>
              </div>
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
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Invoice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Rechnungseinstellungen
              </CardTitle>
              <CardDescription>
                Konfiguration für die Rechnungserstellung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invoice Prefix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechnungspräfix
                  </label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                    placeholder="RE"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    z.B. "RE" für RE-2024-001
                  </p>
                </div>

                {/* Starting Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startnummer
                  </label>
                  <Input
                    type="number"
                    value={settings.invoiceNumberStart}
                    onChange={(e) => handleInputChange('invoiceNumberStart', Number(e.target.value))}
                    min="1"
                  />
                </div>

                {/* Default Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard-Steuersatz (%)
                  </label>
                  <Input
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => handleInputChange('defaultTaxRate', Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zahlungsziel (Tage)
                  </label>
                  <Input
                    type="number"
                    value={settings.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', Number(e.target.value))}
                    min="1"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Währung
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">Britisches Pfund (£)</option>
                    <option value="CHF">Schweizer Franken (CHF)</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sprache
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2 text-purple-600" />
                Design-Einstellungen
              </CardTitle>
              <CardDescription>
                Anpassung des Erscheinungsbilds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primärfarbe
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <Input
                    value={settings.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                {/* Invoice Template */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechnungsvorlage
                  </label>
                  <select
                    value={settings.invoiceTemplate}
                    onChange={(e) => handleInputChange('invoiceTemplate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="modern">Modern</option>
                    <option value="classic">Klassisch</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-green-600" />
                E-Mail-Einstellungen
              </CardTitle>
              <CardDescription>
                Konfiguration für E-Mail-Versand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Signatur
                </label>
                <textarea
                  value={settings.emailSignature}
                  onChange={(e) => handleInputChange('emailSignature', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mit freundlichen Grüßen..."
                />
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
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
