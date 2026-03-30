'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { Mail, Send, X } from 'lucide-react'

interface EmailInvoiceProps {
  invoice: any
  onEmailSent: () => void
  className?: string
  variant?: "outline" | "ghost" | "secondary" | "default"
}

export function EmailInvoice({ invoice, onEmailSent, className, variant = "outline" }: EmailInvoiceProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const { showToast } = useToast()
  const [emailMessage, setEmailMessage] = useState('')

  // Standard-E-Mail-Template generieren
  const generateEmailTemplate = () => {
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('de-DE') : 'Bei Erhalt'

    const subject = `Rechnung ${invoice.number} - ${invoice.amount}`

    const message = `Sehr geehrte/r ${invoice.customerName},

anbei erhalten Sie Ihre Rechnung im PDF-Format.

Rechnungsdetails:
• Rechnungsnummer: ${invoice.number}
• Rechnungsbetrag: ${invoice.amount}
• Fälligkeitsdatum: ${dueDate}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Team`

    setEmailSubject(subject)
    setEmailMessage(message)
  }

  const handleOpenDialog = () => {
    generateEmailTemplate()
    setShowDialog(true)
  }

  const handleSendEmail = async () => {
    if (!invoice.customerEmail) {
      alert('❌ Keine E-Mail-Adresse für diesen Kunden hinterlegt')
      return
    }

    if (!emailSubject.trim()) {
      alert('❌ Bitte geben Sie einen E-Mail-Betreff ein')
      return
    }

    setSending(true)
    try {
      // Kombiniere Standard-Nachricht mit benutzerdefinierter Nachricht
      const finalMessage = customMessage.trim()
        ? `${customMessage}\n\n${emailMessage}`
        : emailMessage

      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerEmail: invoice.customerEmail,
          customerName: invoice.customerName,
          invoiceNumber: invoice.number,
          emailSubject: emailSubject,
          emailMessage: finalMessage,
          invoiceAmount: invoice.amount,
          dueDate: invoice.dueDate
        }),
      })

      const result = await response.json()

      if (result.success) {
        // E-Mail-Status aktualisieren
        await fetch(`/api/invoices/${invoice.id}/email-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sent: true,
            sentTo: invoice.customerEmail,
            messageId: result.messageId
          }),
        })

        showToast(`✅ ${result.message}`, 'success')
        setShowDialog(false)
        setCustomMessage('')
        setEmailSubject('')
        onEmailSent() // Callback zum Aktualisieren der Rechnungsliste
      } else {
        // Fehlgeschlagenen Versuch protokollieren
        await fetch(`/api/invoices/${invoice.id}/email-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sent: false,
            sentTo: invoice.customerEmail
          }),
        })

        showToast(`❌ Fehler: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Fehler beim E-Mail-Versand:', error)
      showToast('❌ Netzwerkfehler beim E-Mail-Versand', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* E-Mail senden Button */}
      <Button
        variant={variant}
        size="icon"
        onClick={handleOpenDialog}
        className={`${className} h-9 w-9 rounded-lg transition-all active:translate-y-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none`}
        aria-label="E-Mail senden"
        title={`Rechnung ${invoice.number} per E-Mail senden`}
      >
        <Mail className="h-[18px] w-[18px] text-blue-600" />
      </Button>

      {/* E-Mail-Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Rechnung per E-Mail senden</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(false)}
                disabled={sending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Rechnungsinfo */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Rechnungsdetails:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Rechnung:</span>
                  <span className="ml-2 font-medium">{invoice.number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Betrag:</span>
                  <span className="ml-2 font-medium">{invoice.amount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Kunde:</span>
                  <span className="ml-2 font-medium">{invoice.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-600">E-Mail:</span>
                  <span className="ml-2 font-medium">{invoice.customerEmail || 'Nicht verfügbar'}</span>
                </div>
              </div>
            </div>

            {/* E-Mail-Betreff */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                E-Mail-Betreff *
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="z.B. Rechnung RE-2024-001 - €119.00"
              />
            </div>

            {/* Benutzerdefinierte Nachricht */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Persönliche Nachricht (optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Zusätzliche persönliche Nachricht für den Kunden..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Diese Nachricht wird vor der Standard-E-Mail eingefügt
              </p>
            </div>

            {/* Standard-E-Mail-Nachricht (Vorschau) */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Standard-E-Mail-Nachricht (wird automatisch eingefügt)
              </label>
              <div className="p-3 bg-gray-50 border rounded-md text-sm whitespace-pre-line max-h-40 overflow-y-auto">
                {emailMessage}
              </div>
            </div>

            {/* Aktionen */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={sending}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sending || !emailSubject.trim() || !invoice.customerEmail}
                className="min-w-[120px]"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    E-Mail senden
                  </>
                )}
              </Button>
            </div>

            {/* Hinweise */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>📧 Hinweise:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Die Rechnung wird automatisch als PDF-Datei angehängt</li>
                <li>• Eine Kopie wird an die konfigurierte CC-Adresse gesendet</li>
                <li>• Der Versandstatus wird in der Rechnungsübersicht angezeigt</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
