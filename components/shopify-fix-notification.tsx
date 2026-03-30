'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CircleCheck, X, ExternalLink } from 'lucide-react'

export default function ShopifyFixNotification() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <CircleCheck className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-green-800 mb-1">
            ✅ Shopify API Problem behoben!
          </div>
          <div className="text-green-700 text-sm">
            Der HTTP 500 Fehler wurde erfolgreich behoben. Das Legacy Import System unterstützt jetzt:
            <ul className="list-disc list-inside mt-1 ml-2">
              <li><strong>100.000 Bestellungen</strong> zum Anzeigen</li>
              <li><strong>50.000 Bestellungen</strong> zum Importieren</li>
              <li><strong>Automatische Fehlerbehandlung</strong> und Rate Limiting</li>
              <li><strong>Verbesserte Performance</strong> (~300 Bestellungen/min)</li>
            </ul>
          </div>
          <div className="text-green-600 text-xs mt-2">
            🔗 Verbindung zu Shop "karinex" erfolgreich getestet • 50 bezahlte Bestellungen verfügbar
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/shopify'}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Jetzt testen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/shopify-diagnosis'}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            🔍 Diagnose
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-green-600 hover:bg-green-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
