'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Settings2, Clock, Percent, Zap, Loader2, Save } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface RecoverySettingsProps {
    isOpen: boolean
    onClose: () => void
}

export function RecoverySettings({ isOpen, onClose }: RecoverySettingsProps) {
    const { showToast } = useToast()
    const [enabled, setEnabled] = useState(false)
    const [autoSendDelay, setAutoSendDelay] = useState(60)
    const [defaultDiscount, setDefaultDiscount] = useState(10)
    const [expiryHours, setExpiryHours] = useState(24)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchSettings()
        }
    }, [isOpen])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/abandoned-carts/settings')
            if (response.ok) {
                const data = await response.json()
                setEnabled(data.enabled)
                setAutoSendDelay(data.autoSendDelay)
                setDefaultDiscount(data.defaultDiscount)
                setExpiryHours(data.expiryHours)
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/abandoned-carts/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled,
                    autoSendDelay,
                    defaultDiscount,
                    expiryHours
                })
            })

            if (response.ok) {
                showToast('Die Automatisierungsregeln wurden aktualisiert.', 'success')
                onClose()
            } else {
                throw new Error('Fehler beim Speichern')
            }
        } catch (error) {
            showToast('Die Einstellungen konnten nicht gespeichert werden.', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-600" />
                        Marketing Automation
                    </DialogTitle>
                    <DialogDescription>
                        Konfigurieren Sie die automatische Wiederherstellung von Warenkörben.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="space-y-0.5">
                                <Label className="text-emerald-900 font-bold">Automatische E-Mails</Label>
                                <p className="text-xs text-emerald-700">Abgebrochene Warenkörbe automatisch kontaktieren.</p>
                            </div>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" /> Verzögerung (Minuten)
                                </Label>
                                <Input
                                    type="number"
                                    value={autoSendDelay}
                                    onChange={(e) => setAutoSendDelay(Number(e.target.value))}
                                    placeholder="z.B. 60"
                                />
                                <p className="text-[10px] text-gray-400">Wie lange nach dem Abbruch soll die erste E-Mail gesendet werden?</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Percent className="w-4 h-4 text-gray-500" /> Standard Rabatt
                                    </Label>
                                    <Input
                                        type="number"
                                        value={defaultDiscount}
                                        onChange={(e) => setDefaultDiscount(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" /> Günstigkeit (Std.)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={expiryHours}
                                        onChange={(e) => setExpiryHours(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-xs border border-blue-100">
                            <strong>Wichtig:</strong> Die Automatisierung nutzt standardmäßig das "Friendly Reminder" Template oder das "Incentive" Template, falls ein Rabatt hinterlegt ist.
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 mr-2" />}
                        Einstellungen speichern
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
