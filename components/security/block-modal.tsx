'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldBan, Loader2 } from "lucide-react"

interface BlockModalProps {
    isOpen: boolean
    onClose: () => void
    onBlock: (data: any) => Promise<void>
}

export function BlockModal({ isOpen, onClose, onBlock }: BlockModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [kind, setKind] = useState<'email' | 'ip'>('email')
    const [formData, setFormData] = useState({
        target: '',
        reason: 'suspicious_activity',
        type: 'PERMANENT',
        duration: '24',
        notes: ''
    })

    const handleSubmit = async () => {
        if (!formData.target) return
        setIsLoading(true)
        try {
            await onBlock({ ...formData, kind })
            setFormData({ target: '', reason: 'suspicious_activity', type: 'PERMANENT', duration: '24', notes: '' })
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <ShieldBan className="h-5 w-5" /> Benutzer blockieren
                    </DialogTitle>
                    <DialogDescription>
                        Der Zugriff wird für den gewählten Benutzer oder IP sofort gesperrt.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Tabs value={kind} onValueChange={(v: any) => setKind(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="email">E-Mail Adresse</TabsTrigger>
                            <TabsTrigger value="ip">IP Adresse</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                        <Label>{kind === 'email' ? 'E-Mail Adresse' : 'IP Adresse'}</Label>
                        <Input
                            placeholder={kind === 'email' ? 'kunde@example.com' : '192.168.1.1'}
                            value={formData.target}
                            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Grund</Label>
                            <Select value={formData.reason} onValueChange={(v) => setFormData({ ...formData, reason: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="suspicious_activity">Verdächtige Aktivität</SelectItem>
                                    <SelectItem value="spam">Spam / Bot</SelectItem>
                                    <SelectItem value="fraud">Betrugsversuch</SelectItem>
                                    <SelectItem value="chargeback">Rücklastschrift</SelectItem>
                                    <SelectItem value="other">Sonstiges</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Dauer</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                                    <SelectItem value="TEMPORARY">Temporär</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.type === 'TEMPORARY' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label>Sperrdauer (Stunden)</Label>
                            <Input
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Interne Notiz (Optional)</Label>
                        <Textarea
                            placeholder="Details zum Vorfall..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Abbrechen</Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={!formData.target || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Blockieren
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
