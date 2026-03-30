'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface ReminderEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    reminderLevel: 'reminder' | 'first_notice' | 'second_notice' | 'final_notice'
    defaultSubject: string
    defaultBody: string
    onSend: (subject: string, body: string) => Promise<void>
    invoiceNumber: string
}

const REMINDER_LEVEL_NAMES = {
    reminder: 'Zahlungserinnerung',
    first_notice: '1. Mahnung',
    second_notice: '2. Mahnung',
    final_notice: 'Letzte Mahnung'
}

export function ReminderEditDialog({
    open,
    onOpenChange,
    reminderLevel,
    defaultSubject,
    defaultBody,
    onSend,
    invoiceNumber
}: ReminderEditDialogProps) {
    const [subject, setSubject] = useState(defaultSubject)
    const [body, setBody] = useState(defaultBody)
    const [sending, setSending] = useState(false)

    // Update fields when dialog opens with new defaults
    useEffect(() => {
        if (open) {
            setSubject(defaultSubject)
            setBody(defaultBody)
        }
    }, [open, defaultSubject, defaultBody])

    const handleSend = async () => {
        setSending(true)
        try {
            await onSend(subject, body)
            onOpenChange(false)
        } catch (error) {
            console.error('Error sending reminder:', error)
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {REMINDER_LEVEL_NAMES[reminderLevel]} bearbeiten
                    </DialogTitle>
                    <DialogDescription>
                        Passen Sie die E-Mail-Nachricht an, bevor Sie sie an den Kunden senden. Rechnung: {invoiceNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium">
                            Betreff
                        </Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="E-Mail Betreff"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body" className="text-sm font-medium">
                            Nachricht
                        </Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="E-Mail Nachricht"
                            className="w-full min-h-[400px] font-mono text-sm"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                            <strong>Tipp:</strong> Sie können Platzhalter wie {'{'}{'{'} invoice_number {'}'}{'}'}, {'{'}{'{'} customer_name {'}'}{'}'}, {'{'}{'{'} total_amount {'}'}{'}'}  verwenden. Diese werden automatisch ersetzt.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={sending}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending || !subject.trim() || !body.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Wird gesendet...
                            </>
                        ) : (
                            'Mahnung senden'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
