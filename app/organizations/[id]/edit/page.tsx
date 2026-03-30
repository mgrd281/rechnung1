'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, ArrowLeft, Save } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

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

export default function EditOrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [organization, setOrganization] = useState<Organization>({
    id: '',
    name: '',
    address: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    taxId: '',
    bankName: '',
    iban: '',
    bic: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrganization()
  }, [params.id])

  const fetchOrganization = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/organizations/${params.id}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setOrganization(data)
    } catch (error) {
      console.error('Error fetching organization:', error)
      showToast('Fehler beim Laden der Organisation', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/organizations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organization)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.organization) {
          setOrganization(data.organization)
        }
        showToast('Organisation erfolgreich aktualisiert!', 'success')
        setTimeout(() => {
          router.push('/organizations')
        }, 1500)
      } else {
        showToast(data.message || 'Fehler beim Speichern der Organisation', 'error')
      }
    } catch (error) {
      console.error('Error saving organization:', error)
      showToast('Netzwerkfehler beim Speichern der Organisation', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Organization, value: string) => {
    setOrganization(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Organisation wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <HeaderNavIcons />
              <div className="mx-1" />
              <Building2 className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Organisation bearbeiten
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
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grundinformationen</CardTitle>
              <CardDescription>
                Allgemeine Daten der Organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmenname *
                  </label>
                  <Input
                    value={organization.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Muster GmbH"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Steuerliche Identifikationsnummer *
                  </label>
                  <Input
                    value={organization.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="DE123456789"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
    </div>
  )
}
