'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Building2, Save, Loader2, Trash2, Globe, MapPin } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { setCompanySettingsClient } from '@/lib/company-settings'

interface CompanySettings {
  companyName: string
  taxNumber: string
  address: string
  postalCode: string
  city: string
  country: string
  phone?: string
  email?: string
  logoPath?: string
  // Legacy bank fields (to be preserved but hidden in UI, or moved to Billing)
  bankName: string
  iban: string
  bic: string
}

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: '',
    taxNumber: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Deutschland',
    phone: '',
    email: '',
    logoPath: '',
    bankName: '',
    iban: '',
    bic: ''
  })

  // Dirty State Tracking
  const [initialSettings, setInitialSettings] = useState<CompanySettings | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const { showToast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  // Check dirty state
  useEffect(() => {
    if (!initialSettings) return
    const isChanged = JSON.stringify(companySettings) !== JSON.stringify(initialSettings)
    setIsDirty(isChanged)
  }, [companySettings, initialSettings])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const companyResponse = await fetch('/api/company-settings')
      if (companyResponse.ok) {
        const companyData = await companyResponse.json()
        setCompanySettings(companyData)
        setInitialSettings(companyData)
        if (companyData.logoPath) {
          setLogoPreview(`/uploads/${companyData.logoPath}`)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showToast('Fehler beim Laden der Einstellungen', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('Die Datei ist zu groß. Maximale Größe: 5MB', 'error')
      return
    }

    if (!file.type.startsWith('image/')) {
      showToast('Bitte wählen Sie eine gültige Bilddatei aus', 'error')
      return
    }

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()

      const newSettings = { ...companySettings, logoPath: result.filename }
      setCompanySettings(newSettings)
      setLogoPreview(`/uploads/${result.filename}`)
      showToast('Logo erfolgreich hochgeladen', 'success')
    } catch (error) {
      console.error('Error uploading logo:', error)
      showToast('Fehler beim Hochladen des Logos', 'error')
    }
  }

  const handleDeleteLogo = async () => {
    try {
      const newSettings = { ...companySettings, logoPath: '' }
      setCompanySettings(newSettings)
      setLogoPreview('')

      const fileInput = document.getElementById('logo') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Sync to local client for PDF
      updateClientSettings(newSettings)

      showToast('Logo erfolgreich entfernt', 'success')
    } catch (error) {
      console.error('Error deleting logo:', error)
    }
  }

  const updateClientSettings = (settings: CompanySettings) => {
    const mappedSettings = {
      id: 'default-org',
      companyName: settings.companyName,
      taxNumber: settings.taxNumber,
      zip: settings.postalCode,
      logoUrl: settings.logoPath || null,
      name: settings.companyName,
      taxId: settings.taxNumber,
      zipCode: settings.postalCode,
      logo: settings.logoPath || null,
      address: settings.address,
      city: settings.city,
      country: settings.country,
      bankName: settings.bankName,
      iban: settings.iban,
      bic: settings.bic,
      phone: settings.phone || '',
      email: settings.email || '',
      pdfTemplateEnabled: false,
      pdfTemplateCode: '',
      pdfTemplateMode: 'custom_only' as const
    }
    setCompanySettingsClient(mappedSettings)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const companyResponse = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companySettings),
      })

      if (!companyResponse.ok) throw new Error('Failed to save company settings')

      updateClientSettings(companySettings)
      setInitialSettings(companySettings)
      setIsDirty(false)
      showToast('Einstellungen gespeichert', 'success')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Fehler beim Speichern', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">

      {/* Header with Sticky Action */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Allgemeine Einstellungen</h2>
          <p className="text-slate-500">Verwalten Sie Unternehmensdaten, Branding und Standort.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`shadow-lg transition-all duration-300 ${isDirty ? 'bg-violet-600 hover:bg-violet-700 translate-y-0 opacity-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed translate-y-2 opacity-0 lg:opacity-100 lg:translate-y-0'}`}
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>

      <Separator />

      {/* FIRMEN DATEN */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" /> Unternehmensdaten
          </CardTitle>
          <CardDescription>Diese Informationen erscheinen auf Ihren Rechnungen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname <span className="text-red-500">*</span></Label>
              <Input
                id="companyName"
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, companyName: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Steuernummer / USt-IdNr. <span className="text-red-500">*</span></Label>
              <Input
                id="taxNumber"
                value={companySettings.taxNumber}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, taxNumber: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail (Rechnungsversand)</Label>
              <Input
                id="email"
                type="email"
                value={companySettings.email || ''}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={companySettings.phone || ''}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ADRESSE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-violet-600" /> Standort & Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Straße & Hausnummer <span className="text-red-500">*</span></Label>
            <Input
              id="address"
              value={companySettings.address}
              onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">PLZ <span className="text-red-500">*</span></Label>
              <Input
                id="postalCode"
                value={companySettings.postalCode}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, postalCode: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Stadt <span className="text-red-500">*</span></Label>
              <Input
                id="city"
                value={companySettings.city}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, city: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land <span className="text-red-500">*</span></Label>
              <Input
                id="country"
                value={companySettings.country}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, country: e.target.value }))}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BRANDING */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-violet-600" /> Branding
          </CardTitle>
          <CardDescription>Logo für Rechnungen und E-Mails.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            {logoPreview ? (
              <div className="relative group">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="max-h-32 object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <Button variant="destructive" size="sm" onClick={handleDeleteLogo}>
                    <Trash2 className="h-4 w-4 mr-2" /> Entfernen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Building2 className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-slate-600">Kein Logo hochgeladen</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG bis 5MB</p>
              </div>
            )}

            <div className="relative mt-2">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Button variant="outline" className="pointer-events-none">
                {logoPreview ? 'Logo ändern' : 'Logo hochgeladen'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
