import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter } from 'lucide-react'
import { AccountingFilter, AccountingPeriod, InvoiceStatus } from '@/lib/accounting-types'

interface AccountingFilterProps {
    filter: AccountingFilter
    setFilter: React.Dispatch<React.SetStateAction<AccountingFilter>>
    handlePeriodChange: (period: AccountingPeriod) => void
}

export function AccountingFilterBar({ filter, setFilter, handlePeriodChange }: AccountingFilterProps) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Filter className="w-5 h-5" />
                    <span>Filter & Zeitraum</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Label htmlFor="period">Zeitraum</Label>
                        <Select
                            value={filter.period}
                            onValueChange={(value: AccountingPeriod) => handlePeriodChange(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Aktueller Monat</SelectItem>
                                <SelectItem value="quarter">Aktuelles Quartal</SelectItem>
                                <SelectItem value="year">Aktuelles Jahr</SelectItem>
                                <SelectItem value="all">Alles (Gesamt)</SelectItem>
                                <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="startDate">Von</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={filter.startDate}
                            onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>

                    <div>
                        <Label htmlFor="endDate">Bis</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={filter.endDate}
                            onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>

                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={filter.status?.join(',') || 'all'}
                            onValueChange={(value) => setFilter(prev => ({
                                ...prev,
                                status: value === 'all' ? [] : value.split(',') as InvoiceStatus[]
                            }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Alle Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="offen">Offen</SelectItem>
                                <SelectItem value="bezahlt">Bezahlt</SelectItem>
                                <SelectItem value="erstattet">Erstattet</SelectItem>
                                <SelectItem value="storniert">Storniert</SelectItem>
                                <SelectItem value="überfällig">Überfällig</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
