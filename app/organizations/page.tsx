'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, ArrowLeft, Edit, Settings, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useSafeNavigation } from '@/hooks/use-safe-navigation'
import { BackButton } from '@/components/navigation/back-button'

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

export default function OrganizationsPage() {
  const router = useRouter()
  const { navigate } = useSafeNavigation()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      console.log('Fetching organizations...')
      const response = await fetch('/api/organizations')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Fetched organizations:', data)

      setOrganizations(data)
    } catch (error) {
      console.error('Error fetching organizations:', error)
      showToast('Fehler beim Laden der Organisationen', 'error')
    } finally {
      setLoading(false)
    }
  }
  // Function to handle organization editing
  const handleEditOrganization = (organizationId: string) => {
    navigate(`/organizations/${organizationId}/edit`)
  }

  // Function to view organization invoices
  const handleViewInvoices = (organizationId: string) => {
    navigate(`/invoices?organization=${organizationId}`)
  }

  // Function to handle organization settings
  const handleSettings = (organizationId: string) => {
    navigate(`/organizations/${organizationId}/settings`)
  }

  // Function to handle organization deletion
  const handleDeleteOrganization = async (organizationId: string, organizationName: string) => {
    const confirmed = window.confirm(`Organisation "${organizationName}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`)

    if (!confirmed) {
      return
    }

    setDeletingId(organizationId)

    try {
      console.log('Deleting organization:', organizationId)

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE'
      })

      console.log('Delete response status:', response.status)
      const data = await response.json()
      console.log('Delete response data:', data)

      if (response.ok) {
        // Remove organization from local state
        setOrganizations(prev => prev.filter(org => org.id !== organizationId))
        showToast(`Organisation "${organizationName}" erfolgreich gelöscht`, 'success')
      } else {
        console.error('Delete failed:', data)
        showToast(data.message || 'Fehler beim Löschen der Organisation', 'error')
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
      showToast('Netzwerkfehler beim Löschen der Organisation', 'error')
    } finally {
      setDeletingId(null)
    }
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
                Organisationen
              </h1>
            </div>
            <Link href="/organizations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Organisation
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Organisationen werden geladen...</p>
          </div>
        ) : organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Building2 className="h-8 w-8 text-purple-600" />
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrganization(org.id)}
                        title="Organisation bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSettings(org.id)}
                        title="Organisationseinstellungen"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrganization(org.id, org.name)}
                        disabled={deletingId === org.id}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        title="Organisation löschen"
                      >
                        {deletingId === org.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{org.name}</CardTitle>
                  <CardDescription>
                    Steuer-ID: {org.taxId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Adresse</h4>
                    <p className="text-sm text-gray-600">
                      {org.address}<br />
                      {org.zipCode} {org.city}<br />
                      {org.country}
                    </p>
                  </div>

                  {/* Bank Details */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Bankverbindung</h4>
                    <p className="text-sm text-gray-600">
                      {org.bankName}<br />
                      IBAN: {org.iban}<br />
                      BIC: {org.bic}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditOrganization(org.id)}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewInvoices(org.id)}
                      >
                        Rechnungen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Noch keine Organisation erstellt
              </h3>
              <p className="text-gray-600 mb-6">
                Erstellen Sie Ihre erste Organisation, um mit der Rechnungserstellung zu beginnen.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Organisation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Über Organisationen</CardTitle>
            <CardDescription>
              Verwalten Sie Ihre Unternehmensdaten für die Rechnungserstellung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Erforderliche Informationen</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Firmenname und Adresse</li>
                  <li>• Steuerliche Identifikationsnummer</li>
                  <li>• Bankverbindung (IBAN, BIC)</li>
                  <li>• Kontaktinformationen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Verwendung</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatische Rechnungserstellung</li>
                  <li>• Rechtskonforme deutsche Rechnungen</li>
                  <li>• Mehrere Organisationen möglich</li>
                  <li>• Individuelle Vorlagen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
    </div>
  )
}
