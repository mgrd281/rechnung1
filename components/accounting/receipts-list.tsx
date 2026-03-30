import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Trash2, Filter, Download, CheckCircle, AlertTriangle, Pencil } from 'lucide-react'

interface Receipt {
    id: string
    date: string
    filename: string
    description: string
    category: string
    url: string
    amount?: number
    ai_status?: 'OK' | 'WARNING' | 'ERROR'
}

interface AdditionalIncome {
    id: string
    date: string
    description: string
    amount: number
    type: string
}

interface ReceiptsListProps {
    receipts: Receipt[]
    additionalIncomes?: AdditionalIncome[]
    selectedReceipts: string[]
    setSelectedReceipts: React.Dispatch<React.SetStateAction<string[]>>
    onDeleteSelected: () => void
    onDelete: (id: string) => void
    onEdit: (receipt: Receipt) => void
}

export function ReceiptsList({
    receipts,
    additionalIncomes = [],
    selectedReceipts,
    setSelectedReceipts,
    onDeleteSelected,
    onDelete,
    onEdit
}: ReceiptsListProps) {

    // Combine receipts and additional incomes for display
    // We map additional incomes to a Receipt-like structure for consistent rendering
    const combinedItems = [
        ...receipts.map(r => ({ ...r, type: 'receipt' })),
        ...additionalIncomes.map(ai => ({
            id: ai.id,
            date: ai.date,
            filename: 'Importiert', // Placeholder for imported items
            description: ai.description,
            category: ai.type,
            url: '',
            amount: ai.amount,
            type: 'income', // Distinguish type
            ai_status: 'OK' as const
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const toggleSelectAll = () => {
        if (selectedReceipts.length === combinedItems.length) {
            setSelectedReceipts([])
        } else {
            setSelectedReceipts(combinedItems.map(r => r.id))
        }
    }

    const toggleSelectOne = (id: string) => {
        if (selectedReceipts.includes(id)) {
            setSelectedReceipts(prev => prev.filter(i => i !== id))
        } else {
            setSelectedReceipts(prev => [...prev, id])
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Beleg-Eingang & Importierte Daten</CardTitle>
                    <CardDescription>Zuletzt hochgeladene Dokumente und importierte Einnahmen</CardDescription>
                </div>
                <div className="flex space-x-2">
                    {selectedReceipts.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onDeleteSelected}
                            className="animate-in fade-in zoom-in"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {selectedReceipts.length} löschen
                        </Button>
                    )}
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={combinedItems.length > 0 && selectedReceipts.length === combinedItems.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Datei / Beschreibung</TableHead>
                            <TableHead>Datum</TableHead>
                            <TableHead>Kategorie</TableHead>
                            <TableHead className="text-right">Betrag</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Aktion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedReceipts.includes(item.id)}
                                        onCheckedChange={() => toggleSelectOne(item.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center space-x-2">
                                        <div className={`h-8 w-8 rounded flex items-center justify-center ${item.type === 'income' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            {item.type === 'income' ? (
                                                <FileText className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[250px] font-medium" title={item.description || item.filename}>
                                                {item.description || item.filename}
                                            </span>
                                            {item.type === 'income' && (
                                                <span className="text-xs text-blue-500">Importiert</span>
                                            )}
                                            {item.type === 'receipt' && item.description && item.description !== item.filename && (
                                                <span className="text-xs text-gray-500 truncate max-w-[150px]">{item.filename}</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{new Date(item.date).toLocaleDateString('de-DE')}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.category === 'INCOME' || item.category === 'income' ? 'bg-green-100 text-green-700' :
                                        item.category === 'EXPENSE' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {item.category === 'INCOME' || item.category === 'income' ? 'Einnahme' :
                                            item.category === 'EXPENSE' ? 'Ausgabe' : 'Sonstiges'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {item.amount ? `€${parseFloat(item.amount.toString()).toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {item.amount && item.ai_status !== 'WARNING' && item.ai_status !== 'ERROR' ? (
                                        <div className="flex items-center justify-center text-green-600" title="Vollständig">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex items-center justify-center text-orange-500 cursor-pointer hover:text-orange-700 hover:scale-110 transition-transform"
                                            title="Bitte prüfen - Klicken zum Bearbeiten"
                                            onClick={() => onEdit(item as any)}
                                        >
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.type === 'receipt' && (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(item as any)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {combinedItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                            <FileText className="h-6 w-6 text-gray-300" />
                                        </div>
                                        <p>Keine Belege oder importierten Daten vorhanden</p>
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
