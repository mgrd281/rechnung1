'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download, 
  RefreshCw, 
  CircleCheck, 
  CircleX, 
  CircleAlert,
  ShoppingCart,
  FileText,
  Users,
  Euro
} from 'lucide-react'

interface ShopifyOrder {
  id: number
  name: string
  email: string
  total_price: string
  currency: string
  created_at: string
  financial_status: string
  fulfillment_status: string | null
  customer: {
    name: string
    email: string
  }
  line_items_count: number
}

interface ImportProgress {
  total: number
  processed: number
  imported: number
  skipped: number
  errors: string[]
  currentOrder?: string
}

interface ShopifyImportWizardProps {
  onComplete?: (result: any) => void
}

export default function ShopifyImportWizard({ onComplete }: ShopifyImportWizardProps) {
  const [step, setStep] = useState<'select' | 'confirm' | 'importing' | 'complete'>('select')
  const [orders, setOrders] = useState<ShopifyOrder[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    imported: 0,
    skipped: 0,
    errors: []
  })
  const [message, setMessage] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/shopify/import?limit=50&financial_status=paid')
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
        // Auto-select all paid orders
        const paidOrderIds = data.orders
          .filter((order: ShopifyOrder) => order.financial_status === 'paid')
          .map((order: ShopifyOrder) => order.id)
        setSelectedOrders(new Set(paidOrderIds))
        setStep('confirm')
      } else {
        setMessage(data.error || 'Fehler beim Laden der Bestellungen')
      }
    } catch (error) {
      setMessage('Fehler beim Laden der Bestellungen')
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderSelection = (orderId: number) => {
    const newSelection = new Set(selectedOrders)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrders(newSelection)
  }

  const selectAllPaid = () => {
    const paidOrderIds = orders
      .filter(order => order.financial_status === 'paid')
      .map(order => order.id)
    setSelectedOrders(new Set(paidOrderIds))
  }

  const deselectAll = () => {
    setSelectedOrders(new Set())
  }

  const startImport = async () => {
    setStep('importing')
    setProgress({
      total: selectedOrders.size,
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: []
    })

    try {
      const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id))
      
      // Import orders in batches
      const batchSize = 5
      let processed = 0
      let imported = 0
      let skipped = 0
      const errors: string[] = []

      for (let i = 0; i < selectedOrdersList.length; i += batchSize) {
        const batch = selectedOrdersList.slice(i, i + batchSize)
        
        for (const order of batch) {
          setProgress(prev => ({
            ...prev,
            processed: processed + 1,
            currentOrder: order.name
          }))

          try {
            // Convert and save order as invoice
            const response = await fetch('/api/invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: 'shopify',
                shopifyOrderId: order.id,
                shopifyOrderData: order
              })
            })

            if (response.ok) {
              imported++
            } else {
              skipped++
              errors.push(`${order.name}: Fehler beim Erstellen der Rechnung`)
            }
          } catch (error) {
            skipped++
            errors.push(`${order.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
          }

          processed++
          setProgress(prev => ({
            ...prev,
            processed,
            imported,
            skipped,
            errors
          }))

          // Small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      setStep('complete')
      if (onComplete) {
        onComplete({ imported, skipped, errors })
      }
    } catch (error) {
      setMessage('Fehler beim Import der Bestellungen')
      setStep('confirm')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      paid: { variant: 'default', label: 'Bezahlt' },
      pending: { variant: 'secondary', label: 'Ausstehend' },
      refunded: { variant: 'destructive', label: 'Erstattet' },
      cancelled: { variant: 'outline', label: 'Storniert' }
    }
    
    const config = statusMap[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateTotals = () => {
    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id))
    const totalAmount = selectedOrdersList.reduce((sum, order) => sum + parseFloat(order.total_price), 0)
    const totalCustomers = new Set(selectedOrdersList.map(order => order.customer.email)).size
    
    return { totalAmount, totalCustomers, totalOrders: selectedOrdersList.length }
  }

  if (step === 'select') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopify Import-Assistent
          </CardTitle>
          <CardDescription>
            Importieren Sie Shopify-Bestellungen als Rechnungen in Ihr System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            <Button
              onClick={loadOrders}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Bestellungen laden
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Lädt verfügbare Bestellungen aus Ihrem Shopify-Shop
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'confirm') {
    const totals = calculateTotals()
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bestellungen auswählen
            </CardTitle>
            <CardDescription>
              Wählen Sie die Bestellungen aus, die als Rechnungen importiert werden sollen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button onClick={selectAllPaid} variant="outline" size="sm">
                  Alle bezahlten auswählen
                </Button>
                <Button onClick={deselectAll} variant="outline" size="sm">
                  Alle abwählen
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {selectedOrders.size} von {orders.length} ausgewählt
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => toggleOrderSelection(order.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.name}</span>
                        {getStatusBadge(order.financial_status)}
                      </div>
                      <span className="font-bold">
                        {order.total_price} {order.currency}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.customer.name} • {order.line_items_count} Artikel • {new Date(order.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedOrders.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import-Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">{totals.totalOrders}</span>
                  </div>
                  <p className="text-sm text-gray-600">Bestellungen</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">{totals.totalCustomers}</span>
                  </div>
                  <p className="text-sm text-gray-600">Kunden</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Euro className="h-4 w-4 text-purple-600" />
                    <span className="text-2xl font-bold">{totals.totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600">Gesamtwert</p>
                </div>
              </div>

              <Alert className="mb-4">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription>
                  Die ausgewählten Bestellungen werden als Rechnungen in Ihr System importiert. 
                  Bereits existierende Rechnungen werden übersprungen.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button onClick={() => setStep('select')} variant="outline">
                  Zurück
                </Button>
                <Button onClick={startImport} disabled={selectedOrders.size === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {selectedOrders.size} Bestellungen importieren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (step === 'importing') {
    const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Import läuft...
          </CardTitle>
          <CardDescription>
            Bestellungen werden als Rechnungen importiert
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Fortschritt</span>
              <span>{progress.processed} von {progress.total}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {progress.currentOrder && (
            <div className="text-center text-sm text-gray-600">
              Verarbeite: {progress.currentOrder}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{progress.imported}</div>
              <div className="text-sm text-gray-600">Importiert</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{progress.skipped}</div>
              <div className="text-sm text-gray-600">Übersprungen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{progress.errors.length}</div>
              <div className="text-sm text-gray-600">Fehler</div>
            </div>
          </div>

          {progress.errors.length > 0 && (
            <Alert variant="destructive">
              <CircleX className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Fehler beim Import:</div>
                <ul className="list-disc list-inside text-sm">
                  {progress.errors.slice(-3).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                {progress.errors.length > 3 && (
                  <div className="text-sm mt-1">... und {progress.errors.length - 3} weitere</div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleCheck className="h-5 w-5 text-green-600" />
            Import abgeschlossen
          </CardTitle>
          <CardDescription>
            Der Import der Shopify-Bestellungen wurde erfolgreich abgeschlossen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{progress.imported}</div>
              <div className="text-sm text-gray-600">Erfolgreich importiert</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">{progress.skipped}</div>
              <div className="text-sm text-gray-600">Übersprungen</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{progress.errors.length}</div>
              <div className="text-sm text-gray-600">Fehler</div>
            </div>
          </div>

          {progress.imported > 0 && (
            <Alert>
              <CircleCheck className="h-4 w-4" />
              <AlertDescription>
                {progress.imported} Rechnungen wurden erfolgreich erstellt und sind nun in Ihrem System verfügbar.
              </AlertDescription>
            </Alert>
          )}

          {progress.errors.length > 0 && (
            <Alert variant="destructive">
              <CircleX className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Fehler beim Import:</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {progress.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <Button onClick={() => setStep('select')} variant="outline">
              Neuer Import
            </Button>
            <Button onClick={() => window.location.href = '/invoices'}>
              Zu den Rechnungen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
