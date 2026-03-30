'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShopifyTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [ordersResult, setOrdersResult] = useState<any>(null)
  const [updateResult, setUpdateResult] = useState<any>(null)

  const testConnection = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/shopify/test-connection')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Netzwerkfehler beim Testen der Verbindung'
      })
    } finally {
      setLoading(false)
    }
  }

  const testOrders = async () => {
    setLoading(true)
    setOrdersResult(null)

    try {
      const response = await fetch('/api/shopify/import?limit=5')
      const data = await response.json()
      setOrdersResult(data)
    } catch (error) {
      setOrdersResult({
        success: false,
        error: 'Netzwerkfehler beim Abrufen der Bestellungen'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async () => {
    setLoading(true)
    setUpdateResult(null)

    try {
      const response = await fetch('/api/shopify/update-settings', {
        method: 'POST'
      })
      const data = await response.json()
      setUpdateResult(data)
    } catch (error) {
      setUpdateResult({
        success: false,
        error: 'Netzwerkfehler beim Aktualisieren der Einstellungen'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Shopify API Test</h1>

      <div className="grid gap-6">
        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Verbindungstest</CardTitle>
            <CardDescription>
              Teste die Verbindung zu Shopify API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testConnection}
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Teste...' : 'Verbindung testen'}
            </Button>

            {testResult && (
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? '✅ Erfolgreich' : '❌ Fehler'}
                </h3>
                <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                  {testResult.message || testResult.error}
                </p>
                {testResult.details && (
                  <p className="text-sm text-gray-600 mt-2">
                    Details: {testResult.details}
                  </p>
                )}
                {testResult.shop && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Shop Name: {testResult.shop.name}</p>
                    <p>Domain: {testResult.shop.domain}</p>
                    <p>Email: {testResult.shop.email}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Test */}
        <Card>
          <CardHeader>
            <CardTitle>Bestellungen abrufen</CardTitle>
            <CardDescription>
              Teste das Abrufen von Bestellungen (max. 5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testOrders}
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Lade...' : 'Bestellungen abrufen'}
            </Button>

            {ordersResult && (
              <div className={`p-4 rounded-lg ${ordersResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-semibold ${ordersResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {ordersResult.success ? '✅ Erfolgreich' : '❌ Fehler'}
                </h3>
                <p className={ordersResult.success ? 'text-green-700' : 'text-red-700'}>
                  {ordersResult.success
                    ? `${ordersResult.orders?.length || 0} Bestellungen gefunden`
                    : ordersResult.error
                  }
                </p>
                {ordersResult.details && (
                  <p className="text-sm text-gray-600 mt-2">
                    Details: {ordersResult.details}
                  </p>
                )}
                {ordersResult.orders && ordersResult.orders.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-green-800 mb-2">Bestellungen:</h4>
                    <div className="space-y-2">
                      {ordersResult.orders.slice(0, 3).map((order: any) => (
                        <div key={order.id} className="bg-white p-3 rounded border">
                          <p><strong>#{order.name}</strong> - {order.total_price} {order.currency}</p>
                          <p>Kunde: {order.customer?.name} ({order.customer?.email})</p>
                          <p>Status: {order.financial_status}</p>
                          <p>Datum: {new Date(order.created_at).toLocaleDateString('de-DE')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Einstellungen aktualisieren</CardTitle>
            <CardDescription>
              Aktualisiere Shopify-Einstellungen mit vollständigen Daten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={updateSettings}
              disabled={loading}
              className="mb-4"
              variant="outline"
            >
              {loading ? 'Aktualisiere...' : 'Einstellungen aktualisieren'}
            </Button>

            {updateResult && (
              <div className={`p-4 rounded-lg ${updateResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-semibold ${updateResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {updateResult.success ? '✅ Erfolgreich' : '❌ Fehler'}
                </h3>
                <p className={updateResult.success ? 'text-green-700' : 'text-red-700'}>
                  {updateResult.message || updateResult.error}
                </p>
                {updateResult.details && (
                  <p className="text-sm text-gray-600 mt-2">
                    Details: {updateResult.details}
                  </p>
                )}
                {updateResult.settings && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Shop: {updateResult.settings.shopDomain}</p>
                    <p>API Key: {updateResult.settings.hasApiKey ? '✅' : '❌'}</p>
                    <p>Secret Key: {updateResult.settings.hasSecretKey ? '✅' : '❌'}</p>
                    <p>Access Token: {updateResult.settings.hasAccessToken ? '✅' : '❌'}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Einstellungen</CardTitle>
            <CardDescription>
              Shopify Integration Konfiguration - Vollständige Daten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Shop Domain:</strong> 45dv93-bk.myshopify.com</p>
              <p><strong>Admin URL:</strong> https://admin.shopify.com/store/45dv93-bk</p>
              <p><strong>API Version:</strong> 2025-01</p>
              <p><strong>API-Schlüssel:</strong> 7d4ea1cf...f8dd (gekürzt)</p>
              <p><strong>Geheimer API-Schlüssel:</strong> 1e24702b...0bc9 (gekürzt)</p>
              <p><strong>Admin API-Token:</strong> SHOPIFY_ACCESS_TOKEN_PLACEHOLDER...dd6 (gekürzt)</p>
              <p><strong>Status:</strong> ✅ Aktiviert</p>
              <p><strong>Auto Import:</strong> ❌ Deaktiviert</p>
              <p><strong>Standard Steuersatz:</strong> 19%</p>
              <p><strong>Zahlungsziel:</strong> 14 Tage</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
