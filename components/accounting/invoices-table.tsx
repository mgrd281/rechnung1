import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AccountingInvoice, getInvoiceStatusLabel, InvoiceStatus } from '@/lib/accounting-types'
import { Trash2, Pencil, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { useState } from 'react'

interface AdditionalIncome {
    id: string
    date: string
    description: string
    amount: number
    type: string
}

interface InvoicesTableProps {
    invoices: AccountingInvoice[]
    additionalIncomes?: AdditionalIncome[]
}

export function InvoicesTable({ invoices, additionalIncomes = [] }: InvoicesTableProps) {
    const router = useRouter()
    const authenticatedFetch = useAuthenticatedFetch()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const getStatusColor = (status: InvoiceStatus) => {
        const colors = {
            'offen': 'bg-blue-100 text-blue-800',
            'bezahlt': 'bg-green-100 text-green-800',
            'erstattet': 'bg-purple-100 text-purple-800',
            'storniert': 'bg-red-100 text-red-800',
            'überfällig': 'bg-orange-100 text-orange-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const handleDelete = async (id: string, number: string) => {
        if (!confirm(`Möchten Sie die Rechnung ${number} wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
            return
        }

        setDeletingId(id)
        try {
            const response = await authenticatedFetch(`/api/invoices/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Refresh the page or list
                router.refresh()
            } else {
                const data = await response.json()
                alert(`Fehler beim Löschen: ${data.error || 'Unbekannter Fehler'}`)
            }
        } catch (error) {
            console.error('Error deleting invoice:', error)
            alert('Fehler beim Löschen der Rechnung')
        } finally {
            setDeletingId(null)
        }
    }

    // Combine and sort all income sources
    const allIncome = [
        ...invoices.map(inv => ({
            id: inv.id,
            date: inv.date,
            number: inv.invoiceNumber,
            description: inv.customerName, // Use customer name as description for invoices
            amount: inv.totalAmount,
            type: 'INVOICE',
            status: inv.status,
            original: inv
        })),
        ...additionalIncomes.map(inc => {
            // Extract order number if present in description (format: [Order #123] Description)
            const orderMatch = inc.description.match(/^\[Order #(.+?)\] (.*)/)
            const number = orderMatch ? orderMatch[1] : '-'
            const description = orderMatch ? orderMatch[2] : inc.description

            return {
                id: inc.id,
                date: inc.date,
                number: number,
                description: description,
                amount: inc.amount,
                type: 'ADDITIONAL',
                status: 'PAID', // Additional income is usually considered paid
                original: inc
            }
        })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Einnahmen</CardTitle>
                    <CardDescription>
                        Alle Einnahmen (Rechnungen und Importe) im gewählten Zeitraum
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Nr. / Typ</TableHead>
                                <TableHead>Beschreibung / Kunde</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Betrag</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allIncome.map((item) => (
                                <TableRow key={`${item.type}-${item.id}`}>
                                    <TableCell>{new Date(item.date).toLocaleDateString('de-DE')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.number !== '-' ? item.number : ''}</span>
                                            <span className="text-xs text-gray-500">
                                                {item.type === 'INVOICE' ? 'Rechnung' : 'Import/Manuell'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>
                                        {item.type === 'INVOICE' ? (
                                            <Badge className={getStatusColor(item.status as InvoiceStatus)}>
                                                {getInvoiceStatusLabel(item.status as InvoiceStatus)}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Einnahme
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">€{Number(item.amount).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        {item.type === 'INVOICE' && (
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/invoices/${item.id}`)}
                                                    title="Ansehen"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id, item.number)}
                                                    disabled={deletingId === item.id}
                                                    title="Löschen"
                                                >
                                                    {deletingId === item.id ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                        {item.type === 'ADDITIONAL' && (
                                            <div className="flex justify-end space-x-2">
                                                {/* Add delete for additional income if needed later */}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {allIncome.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <p>Keine Einnahmen im gewählten Zeitraum gefunden</p>
                                            <p className="text-sm text-gray-400">Prüfen Sie den Datumsfilter oder wählen Sie "Alles (Gesamt)"</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
