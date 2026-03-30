'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Bell,
  Clock,
  Mail,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Settings
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import {
  ReminderSettings,
  ReminderSchedule,
  ReminderTemplate,
  ReminderLevel,
  DEFAULT_REMINDER_SETTINGS,
  DEFAULT_REMINDER_TEMPLATES,
  REMINDER_VARIABLES
} from '@/lib/reminder-types'

export default function RemindersSettingsPage() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReminderSchedule | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/reminders')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error)
      showToast('Fehler beim Laden der Einstellungen', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        showToast('Einstellungen gespeichert', 'success')
      } else {
        showToast('Fehler beim Speichern', 'error')
      }
    } catch (error) {
      console.error('Error saving reminder settings:', error)
      showToast('Fehler beim Speichern', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addScheduleItem = () => {
    const newSchedule: ReminderSchedule = {
      id: `schedule_${Date.now()}`,
      name: 'Neue Erinnerung',
      triggerDays: 7,
      reminderLevel: 'reminder',
      enabled: true,
      channel: 'email',
      time: '09:00',
      template: DEFAULT_REMINDER_TEMPLATES.reminder
    }
    setSettings(prev => ({
      ...prev,
      schedule: [...prev.schedule, newSchedule]
    }))
    setEditingSchedule(newSchedule)
  }

  const updateScheduleItem = (scheduleId: string, updates: Partial<ReminderSchedule>) => {
    setSettings(prev => ({
      ...prev,
      schedule: prev.schedule.map(item =>
        item.id === scheduleId ? { ...item, ...updates } : item
      )
    }))
  }

  const deleteScheduleItem = (scheduleId: string) => {
    setSettings(prev => ({
      ...prev,
      schedule: prev.schedule.filter(item => item.id !== scheduleId)
    }))
  }

  const getReminderLevelBadge = (level: ReminderLevel) => {
    const config = {
      reminder: { label: 'Erinnerung', color: 'bg-blue-100 text-blue-800' },
      first_notice: { label: '1. Mahnung', color: 'bg-yellow-100 text-yellow-800' },
      second_notice: { label: '2. Mahnung', color: 'bg-orange-100 text-orange-800' },
      final_notice: { label: 'Letzte Mahnung', color: 'bg-red-100 text-red-800' }
    }
    const { label, color } = config[level]
    return <Badge className={color}>{label}</Badge>
  }

  const formatTriggerDays = (days: number) => {
    if (days < 0) return `${Math.abs(days)} Tage vor Fälligkeit`
    if (days === 0) return 'Am Fälligkeitstag'
    return `${days} Tage nach Fälligkeit`
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center mb-6 gap-4">
          <HeaderNavIcons />
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rechnungserinnerungen
            </h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Konfigurieren Sie automatische Erinnerungen für überfällige Rechnungen.
          Das System sendet automatisch E-Mails basierend auf Ihrem Zeitplan.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="schedule">Zeitplan</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          <TabsTrigger value="logs">Protokoll</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Grundeinstellungen
              </CardTitle>
              <CardDescription>
                Globale Einstellungen für das Erinnerungssystem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Automatische Erinnerungen aktivieren</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktiviert das automatische Versenden von Rechnungserinnerungen
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Standard-Sprache</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium">Deutsch</span>
                    <span className="text-xs text-muted-foreground">(Standard)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">E-Mail-Optionen</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PDF-Rechnung anhängen</Label>
                    <p className="text-sm text-muted-foreground">
                      Hängt die Rechnung als PDF an die Erinnerungs-E-Mail an
                    </p>
                  </div>
                  <Switch
                    checked={settings.attachPdf}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, attachPdf: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Zahlungslink einschließen</Label>
                    <p className="text-sm text-muted-foreground">
                      Fügt einen Link zur Online-Zahlung in die E-Mail ein
                    </p>
                  </div>
                  <Switch
                    checked={settings.includePaymentLink}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includePaymentLink: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>QR-Code für Zahlung</Label>
                    <p className="text-sm text-muted-foreground">
                      Fügt einen QR-Code für mobile Zahlungen hinzu
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeQrCode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeQrCode: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Settings */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Erinnerungszeitplan
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie wann und wie oft Erinnerungen gesendet werden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Erinnerungsregeln</h3>
                  <Button onClick={addScheduleItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Regel hinzufügen
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.schedule.map((schedule) => (
                    <Card key={schedule.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) =>
                              updateScheduleItem(schedule.id, { enabled: checked })
                            }
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{schedule.name}</h4>
                              {getReminderLevelBadge(schedule.reminderLevel)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatTriggerDays(schedule.triggerDays)} um {schedule.time} Uhr
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteScheduleItem(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                E-Mail-Vorlagen
              </CardTitle>
              <CardDescription>
                Bearbeiten Sie die Vorlagen für Erinnerungs-E-Mails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(DEFAULT_REMINDER_TEMPLATES).map(([level, template]) => (
                    <Card key={level} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          {getReminderLevelBadge(level as ReminderLevel)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(template)
                            setShowTemplateEditor(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.subject}
                      </p>
                    </Card>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Verfügbare Variablen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {REMINDER_VARIABLES.map((variable) => (
                      <div key={variable.key} className="p-3 border rounded-lg">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {`{{${variable.key}}}`}
                        </code>
                        <p className="text-sm text-muted-foreground mt-1">
                          {variable.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          Beispiel: {variable.example}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Erinnerungsprotokoll
              </CardTitle>
              <CardDescription>
                Übersicht über gesendete Erinnerungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Protokoll wird implementiert...</p>
                <p className="text-sm">Hier werden alle gesendeten Erinnerungen angezeigt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
        </Button>
      </div>

      
    </div>
  )
}
