'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Copy, Trash2, FileText, Receipt, AlertCircle, Quote, Truck } from 'lucide-react'
import {
  DocumentTemplate,
  DocumentType,
  getAllDocumentTemplates,
  getTemplatesByType,
  getDocumentTypeLabel,
  getDocumentCategoryLabel,
  RECEIPT_TEMPLATES
} from '@/lib/document-templates'

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedType, setSelectedType] = useState<DocumentType>('receipt')
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // For now, use static templates. Later integrate with API
      const allTemplates = getAllDocumentTemplates()
      setTemplates(allTemplates)
    } catch (error) {
      console.error('Error loading document templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    const newTemplate: DocumentTemplate = {
      id: '',
      name: 'Neue Vorlage',
      type: selectedType,
      category: 'financial',
      isDefault: false,
      content: {
        title: 'Dokumenttitel',
        subtitle: '',
        headerNote: '',
        bodyText: '',
        footerNote: '',
        thankYouNote: '',
        legalNote: '',
        instructionsText: ''
      },
      settings: {
        showBankDetails: true,
        showPaymentInstructions: true,
        showItemsTable: true,
        showTotals: true,
        showDueDate: true,
        showTaxInfo: true,
        requireSignature: false,
        allowPartialPayment: false
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        textColor: '#1f2937',
        backgroundColor: '#ffffff'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setEditingTemplate(newTemplate)
    setIsCreating(true)
  }

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template)
    setIsCreating(false)
  }

  const handleSave = async () => {
    if (!editingTemplate) return

    try {
      // TODO: Implement API call to save template
      console.log('Saving template:', editingTemplate)

      if (isCreating) {
        // Add new template
        const newId = `template-${Date.now()}`
        const newTemplate = { ...editingTemplate, id: newId }
        setTemplates(prev => [...prev, newTemplate])
      } else {
        // Update existing template
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t))
      }

      setEditingTemplate(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Vorlage löschen möchten?')) {
      try {
        // TODO: Implement API call to delete template
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const handleDuplicate = (template: DocumentTemplate) => {
    const duplicated: DocumentTemplate = {
      ...template,
      id: '',
      name: `${template.name} (Kopie)`,
      isDefault: false
    }

    setEditingTemplate(duplicated)
    setIsCreating(true)
  }

  const getTypeIcon = (type: DocumentType) => {
    const icons = {
      'invoice': FileText,
      'receipt': Receipt,
      'payment_notice': AlertCircle,
      'reminder': AlertCircle,
      'quote': Quote,
      'delivery_note': Truck
    }
    const Icon = icons[type] || FileText
    return <Icon className="w-4 h-4" />
  }

  const getTypeColor = (type: DocumentType) => {
    const colors = {
      'invoice': 'bg-blue-100 text-blue-800',
      'receipt': 'bg-green-100 text-green-800',
      'payment_notice': 'bg-orange-100 text-orange-800',
      'reminder': 'bg-red-100 text-red-800',
      'quote': 'bg-purple-100 text-purple-800',
      'delivery_note': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryColor = (category: DocumentTemplate['category']) => {
    const colors = {
      'financial': 'bg-emerald-100 text-emerald-800',
      'commercial': 'bg-blue-100 text-blue-800',
      'administrative': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const filteredTemplates = getTemplatesByType(selectedType)

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dokumentvorlagen
        </h1>
        <p className="text-gray-600">
          Verwalten Sie verschiedene Dokumentvorlagen (Empfangsbestätigungen, Rechnungen, etc.)
        </p>
      </div>

      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as DocumentType)}>
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="receipt" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Quittungen</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Rechnungen</span>
            </TabsTrigger>
            <TabsTrigger value="quote" className="flex items-center space-x-2">
              <Quote className="w-4 h-4" />
              <span>Angebote</span>
            </TabsTrigger>
          </TabsList>

          <Button onClick={handleCreateNew} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Neue Vorlage</span>
          </Button>
        </div>

        <TabsContent value={selectedType}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {getTypeIcon(template.type)}
                        <span>{template.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <Badge className={getTypeColor(template.type)}>
                          {getDocumentTypeLabel(template.type)}
                        </Badge>
                        <Badge className={getCategoryColor(template.category)}>
                          {getDocumentCategoryLabel(template.category)}
                        </Badge>
                        {template.isDefault && (
                          <Badge variant="default">Standard</Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm mb-4">
                    <div className="font-medium text-gray-800">
                      {template.content.title}
                    </div>
                    {template.content.subtitle && (
                      <div className="text-gray-600 text-xs leading-relaxed">
                        "{template.content.subtitle}"
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Einstellungen:</span>
                        <div className="flex space-x-1">
                          {template.settings.showBankDetails && (
                            <Badge variant="outline" className="text-xs">Bank</Badge>
                          )}
                          {template.settings.showTotals && (
                            <Badge variant="outline" className="text-xs">Summe</Badge>
                          )}
                          {template.settings.requireSignature && (
                            <Badge variant="outline" className="text-xs">Unterschrift</Badge>
                          )}
                        </div>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {getTypeIcon(selectedType)}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Vorlagen dieses Typs
              </h3>
              <p className="text-gray-600 mb-4">
                Erstellen Sie eine neue Vorlage für diesen Dokumenttyp
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Neue Vorlage erstellen
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Neue Vorlage erstellen' : 'Vorlage bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              Passen Sie Inhalt und Einstellungen der Vorlage an
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium mb-4">Grundinformationen</h3>
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
                      placeholder="z.B.: Zahlungsbestätigung"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategorie</Label>
                    <Select
                      value={editingTemplate.category}
                      onValueChange={(value: any) => setEditingTemplate({
                        ...editingTemplate,
                        category: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">Finanziell</SelectItem>
                        <SelectItem value="commercial">Kommerziell</SelectItem>
                        <SelectItem value="administrative">Administrativ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Content */}
              <div>
                <h3 className="text-lg font-medium mb-4">Dokumentinhalt</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Dokumenttitel</Label>
                    <Input
                      id="title"
                      value={editingTemplate.content.title}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        content: { ...editingTemplate.content, title: e.target.value }
                      })}
                      placeholder="z.B.: Zahlungsbestätigung"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Untertitel</Label>
                    <Input
                      id="subtitle"
                      value={editingTemplate.content.subtitle || ''}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        content: { ...editingTemplate.content, subtitle: e.target.value }
                      })}
                      placeholder="Untertitel für das Dokument"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bodyText">Haupttext</Label>
                    <Textarea
                      id="bodyText"
                      value={editingTemplate.content.bodyText || ''}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        content: { ...editingTemplate.content, bodyText: e.target.value }
                      })}
                      placeholder="Haupttext des Dokuments"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="footerNote">Fußnote</Label>
                    <Textarea
                      id="footerNote"
                      value={editingTemplate.content.footerNote || ''}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        content: { ...editingTemplate.content, footerNote: e.target.value }
                      })}
                      placeholder="Text am Ende des Dokuments"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Dokumenteinstellungen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBankDetails">Bankdaten anzeigen</Label>
                    <Switch
                      id="showBankDetails"
                      checked={editingTemplate.settings.showBankDetails}
                      onCheckedChange={(checked) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, showBankDetails: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTotals">Summen anzeigen</Label>
                    <Switch
                      id="showTotals"
                      checked={editingTemplate.settings.showTotals}
                      onCheckedChange={(checked) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, showTotals: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireSignature">Unterschrift erforderlich</Label>
                    <Switch
                      id="requireSignature"
                      checked={editingTemplate.settings.requireSignature}
                      onCheckedChange={(checked) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, requireSignature: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowPartialPayment">Teilzahlung erlauben</Label>
                    <Switch
                      id="allowPartialPayment"
                      checked={editingTemplate.settings.allowPartialPayment}
                      onCheckedChange={(checked) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, allowPartialPayment: checked }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>
                  {isCreating ? 'Erstellen' : 'Speichern'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
