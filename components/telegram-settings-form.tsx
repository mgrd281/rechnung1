'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function TelegramSettingsForm() {
    const [settings, setSettings] = useState({
        botToken: '',
        isEnabled: false,
        allowedUsers: [] as { telegramUserId: string, name: string }[]
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/telegram/settings')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setSettings({
                        botToken: data.botToken || '',
                        isEnabled: data.isEnabled || false,
                        allowedUsers: data.allowedUsers || []
                    })
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/telegram/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                toast.success("Einstellungen gespeichert")
            } else {
                toast.error("Fehler beim Speichern")
            }
        } catch (e) {
            toast.error("Fehler beim Speichern")
        } finally {
            setSaving(false)
        }
    }

    const addUser = () => {
        setSettings({
            ...settings,
            allowedUsers: [...settings.allowedUsers, { telegramUserId: '', name: '' }]
        })
    }

    const removeUser = (index: number) => {
        const newUsers = [...settings.allowedUsers]
        newUsers.splice(index, 1)
        setSettings({ ...settings, allowedUsers: newUsers })
    }

    const updateUser = (index: number, field: string, value: string) => {
        const newUsers = [...settings.allowedUsers]
        newUsers[index] = { ...newUsers[index], [field]: value }
        setSettings({ ...settings, allowedUsers: newUsers })
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Telegram Bot Konfiguration</CardTitle>
                    <CardDescription>Verbinden Sie Ihren Telegram Bot, um Berichte zu erhalten.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="font-medium">Aktivieren</label>
                        <Switch
                            checked={settings.isEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bot Token (von BotFather)</label>
                        <Input
                            type="password"
                            value={settings.botToken}
                            onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Autorisierte Benutzer</CardTitle>
                    <CardDescription>Nur diese Benutzer können Befehle senden.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {settings.allowedUsers.map((user, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Telegram User ID</label>
                                <Input
                                    value={user.telegramUserId}
                                    onChange={(e) => updateUser(index, 'telegramUserId', e.target.value)}
                                    placeholder="12345678"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Name (Optional)</label>
                                <Input
                                    value={user.name}
                                    onChange={(e) => updateUser(index, 'name', e.target.value)}
                                    placeholder="Max"
                                />
                            </div>
                            <Button variant="destructive" size="icon" onClick={() => removeUser(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" onClick={addUser} className="w-full">
                        <Plus className="h-4 w-4 mr-2" /> Benutzer hinzufügen
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Speichern...' : 'Einstellungen speichern'}
                </Button>
            </div>

            <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Webhook URL
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                        Um den Bot zu aktivieren, müssen Sie den Webhook bei Telegram setzen. Rufen Sie diese URL im Browser auf (ersetzen Sie TOKEN):
                    </p>
                    <code className="block bg-white p-2 rounded text-xs break-all border border-blue-200">
                        https://api.telegram.org/bot{settings.botToken || 'TOKEN'}/setWebhook?url=https://invoice-production-8cd6.up.railway.app/api/telegram/webhook
                    </code>
                </CardContent>
            </Card>
        </div>
    )
}
