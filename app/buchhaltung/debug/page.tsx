import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FixDataButton } from '@/components/accounting/fix-data-button'

export const dynamic = 'force-dynamic'

async function getDebugData() {
    const invoiceCount = await prisma.invoice.count()
    const expenseCount = await prisma.expense.count()
    const incomeCount = await prisma.additionalIncome.count()
    const receiptCount = await prisma.receipt.count()

    const recentInvoices = await prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, invoiceNumber: true, issueDate: true, totalGross: true, createdAt: true, organizationId: true }
    })

    const recentExpenses = await prisma.expense.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, description: true, date: true, totalAmount: true, createdAt: true, organizationId: true }
    })

    const recentIncome = await prisma.additionalIncome.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: { id: true, description: true, date: true, amount: true, type: true, organizationId: true }
    })

    const organizations = await prisma.organization.findMany({
        include: { _count: { select: { users: true, invoices: true, additionalIncomes: true } } }
    })

    return {
        counts: { invoiceCount, expenseCount, incomeCount, receiptCount },
        recentInvoices,
        recentExpenses,
        recentIncome,
        organizations
    }
}

export default async function DebugPage() {
    const data = await getDebugData()

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="mx-1" />
                        <h1 className="text-3xl font-bold text-gray-900">System Diagnose</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                        Serverzeit: {new Date().toLocaleString('de-DE')}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Rechnungen (DB)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.counts.invoiceCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Ausgaben (DB)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.counts.expenseCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Zusätzliche Einnahmen (DB)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.counts.incomeCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Belege (DB)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.counts.receiptCount}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Organisationen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>User Count</TableHead>
                                        <TableHead>Invoices</TableHead>
                                        <TableHead>Incomes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.organizations.map((org) => (
                                        <TableRow key={org.id}>
                                            <TableCell className="font-mono text-xs">{org.id}</TableCell>
                                            <TableCell>{org.name}</TableCell>
                                            <TableCell>{org._count.users}</TableCell>
                                            <TableCell>{org._count.invoices}</TableCell>
                                            <TableCell>{org._count.additionalIncomes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="pt-4 border-t">
                                <form action="/api/debug/fix-org-ids" method="POST">
                                    <FixDataButton />
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Letzte 5 Zusätzliche Einnahmen (Importiert)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Beschreibung</TableHead>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Org ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentIncome.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div className="truncate w-40" title={item.description}>{item.description}</div>
                                            </TableCell>
                                            <TableCell>{new Date(item.date).toLocaleDateString('de-DE')}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.organizationId}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Letzte 5 Rechnungen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nummer</TableHead>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Org ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentInvoices.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.invoiceNumber}</TableCell>
                                            <TableCell>{new Date(item.issueDate).toLocaleDateString('de-DE')}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.organizationId}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
