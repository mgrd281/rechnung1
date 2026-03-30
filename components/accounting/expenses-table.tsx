import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Expense } from '@/lib/accounting-types'

interface ExpensesTableProps {
    expenses: Expense[]
    onEdit: (expense: Expense) => void
    onDelete: (id: string) => void
}

export function ExpensesTable({ expenses, onEdit, onDelete }: ExpensesTableProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Ausgaben</CardTitle>
                        <CardDescription>
                            Alle Betriebsausgaben im gewählten Zeitraum
                        </CardDescription>
                    </div>
                    <Link href="/buchhaltung/ausgaben/new">
                        <Button className="flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Ausgabe hinzufügen</span>
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Beschreibung</TableHead>
                            <TableHead>Lieferant</TableHead>
                            <TableHead>Kategorie</TableHead>
                            <TableHead className="text-right">Netto</TableHead>
                            <TableHead className="text-right">MwSt</TableHead>
                            <TableHead className="text-right">Brutto</TableHead>
                            <TableHead className="text-right">Aktion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>{new Date(expense.date).toLocaleDateString('de-DE')}</TableCell>
                                <TableCell>{expense.description}</TableCell>
                                <TableCell>{expense.supplier}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{expense.category}</Badge>
                                </TableCell>
                                <TableCell className="text-right">€{Number(expense.netAmount).toFixed(2)}</TableCell>
                                <TableCell className="text-right">€{Number(expense.taxAmount).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">€{Number(expense.totalAmount).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end space-x-1">
                                        {expense.receiptUrl && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(expense.receiptUrl, '_blank')}
                                            >
                                                <Eye className="w-4 h-4 text-blue-500" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>
                                            <Pencil className="w-4 h-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onDelete(expense.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {expenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <p>Keine Ausgaben im gewählten Zeitraum gefunden</p>
                                        <p className="text-sm text-gray-400">Prüfen Sie den Datumsfilter oder wählen Sie "Alles (Gesamt)"</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
