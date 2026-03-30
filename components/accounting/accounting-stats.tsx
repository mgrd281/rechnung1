import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Euro, FileText } from 'lucide-react'
import { AccountingSummary } from '@/lib/accounting-types'

interface AccountingStatsProps {
    summary: AccountingSummary | null
}

export function AccountingStats({ summary }: AccountingStatsProps) {
    if (!summary) return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Einnahmen</CardTitle>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        €{summary.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {summary.paidInvoices.count} bezahlte Rechnungen
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Ausgaben</CardTitle>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        €{summary.totalExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Betriebsausgaben
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Nettoeinkommen</CardTitle>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Euro className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        €{summary.netIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Einnahmen - Ausgaben
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Umsatzsteuer</CardTitle>
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                        €{summary.totalTax.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Vereinnahmt - Vorsteuer
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
