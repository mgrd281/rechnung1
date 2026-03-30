import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface EditReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    receipt: any
    onSave: (id: string, data: any) => Promise<void>
}

export function EditReceiptDialog({ open, onOpenChange, receipt, onSave }: EditReceiptDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: '',
        date: '',
        description: '',
        category: 'EXPENSE',
        supplier: ''
    })

    useEffect(() => {
        if (receipt) {
            setFormData({
                amount: receipt.amount ? receipt.amount.toString() : '',
                date: receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : '',
                description: receipt.description || '',
                category: receipt.category || 'EXPENSE',
                supplier: receipt.supplier || ''
            })
        }
    }, [receipt])

    const handleSave = async () => {
        try {
            setLoading(true)
            await onSave(receipt.id, {
                ...formData,
                amount: formData.amount ? parseFloat(formData.amount.replace(',', '.')) : null
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to save', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Beleg bearbeiten</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Betrag
                        </Label>
                        <Input
                            id="amount"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="col-span-3"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Datum
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supplier" className="text-right">
                            Händler
                        </Label>
                        <Input
                            id="supplier"
                            value={formData.supplier}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            className="col-span-3"
                            placeholder="z.B. Amazon"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Kategorie
                        </Label>
                        <Select
                            value={formData.category}
                            onValueChange={(v) => setFormData({ ...formData, category: v })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EXPENSE">Ausgabe</SelectItem>
                                <SelectItem value="INCOME">Einnahme</SelectItem>
                                <SelectItem value="OTHER">Sonstiges</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Beschreibung
                        </Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Speichern
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
