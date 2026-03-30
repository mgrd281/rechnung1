'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, ArrowLeft, FileText, Eye, Download, Plus } from 'lucide-react'
import { downloadInvoicePDF } from '@/lib/pdf-client'
import { useToast } from '@/components/ui/toast'

interface Customer {
  id: string
  name: string
  email: string
}

interface Invoice {
  id: string
  number: string
  date: string
  amount: string
  status: string
  statusColor: string
}

export default function CustomerInvoicesPage({ params }: { params: { id: string } }) {
  const { showToast, removeToast } = useToast()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerAndInvoices()
  }, [params.id])

  const fetchCustomerAndInvoices = async () => {
    try {
      const mockCustomer: Customer = { id: params.id, name: 'Max Mustermann', email: 'max.mustermann@email.com' }
      const mockInvoices: Invoice[] = [
        { id: '1', number: 'RE-2024-001', date: '2024-01-15', amount: '€119.00', status: 'Bezahlt', statusColor: 'bg-green-100 text-green-800' }
      ]
      setCustomer(mockCustomer)
      setInvoices(mockInvoices)
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
        description: invoiceNumber ? `Rechnung #${invoiceNumber} wurde gespeichert.` : 'Rechnung wurde gespeichert.',
        variant: 'premium',
        duration: 6000
      })
    } catch (error) {
      if (toastId) removeToast(toastId)
      showToast('Fehler beim Download', 'error')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Lade...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/customers"><Button variant="ghost" size="sm" className="mr-4"><ArrowLeft className="h-4 w-4 mr-2" /> Zurück</Button></Link>
              <div><h1 className="text-2xl font-bold">{customer?.name}</h1><p className="text-sm text-gray-600">{customer?.email}</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader><CardTitle>Rechnungen</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nummer</TableHead><TableHead>Datum</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.number}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/invoices/${inv.id}`}><Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(inv.id, inv.number)}><Download className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

    </div>
  )
}
