'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  ArrowLeft,
  Save,
  Eye,
  Palette
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-compat'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ProtectedRoute } from '@/components/protected-route'
import { InvoiceTemplate } from '@/lib/invoice-templates'

export default function TemplatesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const authenticatedFetch = useAuthenticatedFetch()

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Load templates
  useEffect(() => {
    if (isAuthenticated) {
      loadTemplates()
    }
  }, [isAuthenticated])

  const loadTemplates = async () => {
    try {
      const response = await authenticatedFetch('/api/invoice-templates')
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    const newTemplate: InvoiceTemplate = {
      id: '',
      name: 'Neue Vorlage',
      type: 'custom',
      isDefault: false,
      texts: {
        title: 'Rechnung',
        subtitle: '',
        footerNote: '',
        paymentNote: '',
        thankYouNote: '',
        legalNote: ''
      },
      defaults: {
        status: 'Offen',
        dueDays: 14,
        taxRate: 19,
        showBankDetails: true,
        showPaymentInstructions: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setEditingTemplate(newTemplate)
    setIsCreating(true)
  }

  const handleEdit = (template: InvoiceTemplate) => {
    setEditingTemplate({ ...template })
    setIsCreating(false)
  }

  const handleSave = async () => {
    if (!editingTemplate) return

    try {
      const url = isCreating ? '/api/invoice-templates' : '/api/invoice-templates'
      const method = isCreating ? 'POST' : 'PUT'

      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      })

      const result = await response.json()

      if (result.success) {
        await loadTemplates()
        setEditingTemplate(null)
        setIsCreating(false)
      } else {
        alert('Fehler beim Speichern: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Fehler beim Speichern der Vorlage')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Möchten Sie diese Vorlage wirklich löschen?')) return

    try {
      const response = await authenticatedFetch(`/api/invoice-templates?id=${templateId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadTemplates()
      } else {
        alert('Fehler beim Löschen: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Fehler beim Löschen der Vorlage')
    }
  }

  const handleDuplicate = (template: InvoiceTemplate) => {
    const duplicated: InvoiceTemplate = {
      ...template,
      id: '',
      name: `${template.name} (Kopie)`,
      isDefault: false
    }

    setEditingTemplate(duplicated)
    setIsCreating(true)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'offen': 'Zahlungsaufforderung',
      'bezahlt': 'Zahlungsbestätigung',
      'storniert': 'Stornierung',
      'promo': 'Sonderangebot',
      'erstattet': 'Gutschrift',
      'custom': 'Benutzerdefiniert'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'offen': 'bg-blue-100 text-blue-800',
      'bezahlt': 'bg-green-100 text-green-800',
      'storniert': 'bg-red-100 text-red-800',
      'promo': 'bg-yellow-100 text-yellow-800',
      'erstattet': 'bg-purple-100 text-purple-800',
      'custom': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vorlagen werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Rechnungsvorlagen</h1>
                  <p className="text-sm text-gray-500">Verwalten Sie Ihre Rechnungsvorlagen</p>
                </div>
              </div>
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Neue Vorlage
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {editingTemplate ? (
            // Template Editor
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  {isCreating ? 'Neue Vorlage erstellen' : 'Vorlage bearbeiten'}
                </CardTitle>
                <CardDescription>
                  Passen Sie die Texte und Einstellungen für diese Vorlage an
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vorlagenname</Label>
                    <Input
                      id="name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value
                      })}
                      placeholder="z.B. Offene Rechnung"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Typ</Label>
                    <Select
                      value={editingTemplate.type}
                      onValueChange={(value: any) => setEditingTemplate({
                        ...editingTemplate,
                        type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offen">Offene Rechnung</SelectItem>
                        <SelectItem value="bezahlt">Bezahlte Rechnung</SelectItem>
                        <SelectItem value="storniert">Stornierte Rechnung</SelectItem>
                        <SelectItem value="promo">Promo Rechnung</SelectItem>
                        <SelectItem value="erstattet">Gutschrift / Erstattungs-Rechnung</SelectItem>
                        <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Static Texts */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Feste Vorlagentexte</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Rechnungstitel</Label>
                      <Input
                        id="title"
                        value={editingTemplate.texts.title}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          texts: { ...editingTemplate.texts, title: e.target.value }
                        })}
                        placeholder="z.B.: Offene Rechnung, Bezahlte Rechnung"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Untertitel</Label>
                      <Textarea
                        id="subtitle"
                        value={editingTemplate.texts.subtitle || ''}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          texts: { ...editingTemplate.texts, subtitle: e.target.value }
                        })}
                        placeholder="z.B.: Bitte zahlen Sie den Betrag vor dem Fälligkeitsdatum"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentNote">Zahlungshinweise</Label>
                      <Textarea
                        id="paymentNote"
                        value={editingTemplate.texts.paymentNote || ''}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          texts: { ...editingTemplate.texts, paymentNote: e.target.value }
                        })}
                        placeholder="Spezielle Zahlungsanweisungen je nach Rechnungstyp"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="footerNote">Fußzeile / Signatur</Label>
                      <Textarea
                        id="footerNote"
                        value={editingTemplate.texts.footerNote || ''}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          texts: { ...editingTemplate.texts, footerNote: e.target.value }
                        })}
                        placeholder="Fester Text am Ende der Rechnung"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="thankYouNote">Dankesnachricht</Label>
                      <Textarea
                        id="thankYouNote"
                        value={editingTemplate.texts.thankYouNote || ''}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          texts: { ...editingTemplate.texts, thankYouNote: e.target.value }
                        })}
                        placeholder="Individuelle Dankesnachricht je nach Rechnungstyp"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Default Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Standardeinstellungen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultStatus">Standardstatus</Label>
                      <Select
                        value={editingTemplate.defaults?.status || 'Offen'}
                        onValueChange={(value: any) => setEditingTemplate({
                          ...editingTemplate,
                          defaults: { ...(editingTemplate.defaults || {}), status: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Offen">Offen</SelectItem>
                          <SelectItem value="Bezahlt">Bezahlt</SelectItem>
                          <SelectItem value="Storniert">Storniert</SelectItem>
                          <SelectItem value="Gutschrift">Gutschrift</SelectItem>
                          <SelectItem value="Mahnung">Mahnung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dueDays">Zahlungsziel (Tage)</Label>
                      <Input
                        id="dueDays"
                        type="number"
                        value={editingTemplate.defaults?.dueDays || 14}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          defaults: { ...(editingTemplate.defaults || {}), dueDays: Number(e.target.value) }
                        })}
                        placeholder="14"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate">Steuersatz (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        value={editingTemplate.defaults?.taxRate || 19}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          defaults: { ...(editingTemplate.defaults || {}), taxRate: Number(e.target.value) }
                        })}
                        placeholder="19"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showBankDetails">Bankdaten anzeigen</Label>
                      <Switch
                        id="showBankDetails"
                        checked={editingTemplate.defaults?.showBankDetails || true}
                        onCheckedChange={(checked) => setEditingTemplate({
                          ...editingTemplate,
                          defaults: { ...(editingTemplate.defaults || {}), showBankDetails: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showPaymentInstructions">Zahlungshinweise anzeigen</Label>
                      <Switch
                        id="showPaymentInstructions"
                        checked={editingTemplate.defaults?.showPaymentInstructions || true}
                        onCheckedChange={(checked) => setEditingTemplate({
                          ...editingTemplate,
                          defaults: { ...(editingTemplate.defaults || {}), showPaymentInstructions: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null)
                      setIsCreating(false)
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Templates List
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center">
                          {template.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 mr-2" />
                          )}
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                            {getTypeLabel(template.type)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm mb-4">
                      <div className="font-medium text-gray-800">
                        {template.texts.title}
                      </div>
                      {template.texts.subtitle && (
                        <div className="text-gray-600 text-xs leading-relaxed">
                          "{template.texts.subtitle}"
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Status:</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${(template.defaults?.status || 'Offen') === 'Bezahlt' ? 'bg-green-100 text-green-700' :
                            (template.defaults?.status || 'Offen') === 'Storniert' ? 'bg-red-100 text-red-700' :
                              ((template.defaults?.status || 'Offen') === 'Gutschrift' || (template.defaults?.status || 'Offen') === 'Erstattet') ? 'bg-purple-100 text-purple-700' :
                                (template.defaults?.status || 'Offen') === 'Mahnung' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'
                            }`}>
                            {template.defaults?.status || 'Offen'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.defaults?.dueDays || 14} Tage
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(template.updatedAt).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
