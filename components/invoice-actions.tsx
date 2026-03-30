'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InvoiceType, ExtendedInvoice } from '@/lib/invoice-types'
import { CircleX, RotateCcw, Trash2, RefreshCw } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'

interface InvoiceActionsProps {
  invoice: any
  onInvoiceUpdated: () => void
  onDelete: (id: string, number: string) => void
  onSync?: (invoice: any) => void
}

export function InvoiceActions({ invoice, onInvoiceUpdated, onDelete, onSync }: InvoiceActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundItems, setRefundItems] = useState<Record<string, number>>({})

  // Status mapping
  const status = invoice.status?.toUpperCase() || ''
  const isPaid = status === 'PAID' || status === 'BEZAHLT'
  const isCancelled = status === 'CANCELLED' || status === 'STORNIERT'
  const isRefunded = ['REFUND_FULL', 'REFUND_PARTIAL', 'CREDIT_NOTE', 'REFUND', 'ERSTATTET'].includes(status)
  const isOpen = ['SENT', 'OPEN', 'OFFEN', 'PENDING', 'OVERDUE'].includes(status)

  // Actions availability
  const canCancel = (invoice.type === InvoiceType.REGULAR || !invoice.type) && !isCancelled && !isRefunded && isOpen
  const canRefund = (invoice.type === InvoiceType.REGULAR || !invoice.type) && isPaid

  const handleCancelInvoice = async () => {
    if (!cancelReason.trim()) return
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
          processingNotes: `Storniert am ${new Date().toLocaleDateString('de-DE')}`
        }),
      })
      const result = await response.json()
      if (result.success) {
        setShowCancelDialog(false)
        setCancelReason('')
        onInvoiceUpdated()
      } else {
        alert(`Fehler: ${result.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Stornieren:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefundInvoice = async () => {
    const hasRefundItems = Object.values(refundItems).some(qty => qty > 0)
    if (!hasRefundItems || !refundReason.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundItems,
          reason: refundReason,
          refundMethod: 'bank_transfer',
          processingNotes: `Rückerstattung am ${new Date().toLocaleDateString('de-DE')}`
        }),
      })
      const result = await response.json()
      if (result.success) {
        setShowRefundDialog(false)
        setRefundReason('')
        setRefundItems({})
        onInvoiceUpdated()
      } else {
        alert(`Fehler: ${result.error}`)
      }
    } catch (error) {
      console.error('Fehler bei der Rückerstattung:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Dropdown Items */}
      {canCancel && (
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowCancelDialog(true); }}>
          <CircleX className="mr-2 h-4 w-4 text-orange-600" />
          Stornieren
        </DropdownMenuItem>
      )}

      {canRefund && (
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowRefundDialog(true); }}>
          <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
          Erstatten
        </DropdownMenuItem>
      )}

      {onSync && (
        <DropdownMenuItem onSelect={() => onSync(invoice)}>
          <RefreshCw className="mr-2 h-4 w-4 text-gray-500" />
          Erneut synchronisieren
        </DropdownMenuItem>
      )}

      {(canCancel || canRefund || onSync) && <DropdownMenuSeparator />}

      <DropdownMenuItem
        onSelect={() => onDelete(invoice.id, invoice.number)}
        className="text-red-600 focus:text-red-700 focus:bg-red-50"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Löschen
      </DropdownMenuItem>

      {/* Storno Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechnung stornieren</DialogTitle>
            <DialogDescription>
              Möchten Sie die Rechnung {invoice.number} wirklich stornieren?
              Dies erstellt eine Stornorechnung.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">Grund für die Stornierung *</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="z.B. Kundenwunsch..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleCancelInvoice} disabled={isProcessing || !cancelReason.trim()}>
              {isProcessing ? 'Verarbeite...' : 'Stornieren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rückerstattung erstellen</DialogTitle>
            <DialogDescription>
              Wählen Sie die Positionen für die Rückerstattung der Rechnung {invoice.number}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {invoice.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">{item.description}</div>
                  <div className="text-xs text-gray-500">
                    {item.quantity} × {new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency || 'EUR' }).format(item.unitPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500">Menge:</span>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={refundItems[item.id] || 0}
                    onChange={(e) => setRefundItems(prev => ({
                      ...prev,
                      [item.id]: parseInt(e.target.value) || 0
                    }))}
                    className="w-16 h-8 p-1 border rounded text-center text-sm font-bold"
                  />
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">Grund für die Rückerstattung *</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="z.B. Defekte Ware..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Abbrechen</Button>
            <Button
              onClick={handleRefundInvoice}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing || !refundReason.trim() || !Object.values(refundItems).some(qty => qty > 0)}
            >
              {isProcessing ? 'Verarbeite...' : 'Gutschrift erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>
}
