'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, ArrowLeft, Download, Eye, RefreshCw } from 'lucide-react'
import { downloadInvoicePDF } from '@/lib/pdf-client'
import { useToast } from '@/components/ui/toast'

export default function CsvInvoicesPage() {
  const { showToast, removeToast } = useToast()
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCsvData()
  }, [])

  const fetchCsvData = async () => {
    try {
      const response = await fetch('/api/invoices/csv')
      const data = await response.json()
      setInvoices(data.invoices || [])
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching CSV data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    let toastId = ''
    try {
      toastId = showToast('PDF wird generiert...', 'loading')
      await downloadInvoicePDF(invoiceId, invoiceNumber)
      if (toastId) removeToast(toastId)
      showToast('', 'success', {
        title: 'PDF heruntergeladen',
        description: invoiceNumber ? `Rechnung ${invoiceNumber.startsWith('#') ? invoiceNumber : '#' + invoiceNumber} wurde gespeichert.` : 'Rechnung wurde gespeichert.',
        variant: 'premium',
        duration: 6000
      })
    } catch (error) {
      if (toastId) removeToast(toastId)
      console.error('Error downloading PDF:', error)
      showToast('Fehler beim Herunterladen der PDF-Datei', 'error')
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchCsvData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">CSV-Daten werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/invoices">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zu Rechnungen
                </Button>
              </Link>
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CSV-Rechnungen</h1>
                <p className="text-sm text-gray-600">Shopify CSV Rechnungen</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rechnungen</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{invoices.length}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>CSV-Rechnungen</CardTitle></CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead><TableHead>Kunde</TableHead><TableHead>Datum</TableHead><TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/invoices/${invoice.id}`}><Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(invoice.id, invoice.number)}><Download className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12"><p>Keine Rechnungen gefunden.</p></div>
            )}
          </CardContent>
        </Card>
      </main>

    </div>
  )
}
