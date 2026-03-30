
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Starting Database Diagnosis...')

    try {
        // 1. Count total invoices
        const totalInvoices = await prisma.invoice.count()
        console.log(`\n📄 Total Invoices in DB: ${totalInvoices}`)

        // 2. Group by Status
        const invoicesByStatus = await prisma.invoice.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            _sum: {
                totalGross: true
            }
        })

        console.log('\n📊 Invoices by Status:')
        invoicesByStatus.forEach(group => {
            console.log(`   - ${group.status}: ${group._count.id} invoices, Sum: €${Number(group._sum.totalGross).toFixed(2)}`)
        })

        // 3. Check for specific "problematic" invoices (e.g. 0 amount)
        const zeroAmountInvoices = await prisma.invoice.count({
            where: {
                totalGross: 0
            }
        })
        console.log(`\n⚠️ Invoices with €0.00 amount: ${zeroAmountInvoices}`)

        // 4. Check Document Kinds
        const invoicesByKind = await prisma.invoice.groupBy({
            by: ['documentKind'],
            _count: {
                id: true
            }
        })
        console.log('\n📑 Invoices by Document Kind:')
        invoicesByKind.forEach(group => {
            console.log(`   - ${group.documentKind}: ${group._count.id}`)
        })

        // 5. Check Customers
        const totalCustomers = await prisma.customer.count()
        console.log(`\n👥 Total Customers: ${totalCustomers}`)

        // 6. Sample Invoices
        console.log('\n🔍 Sample Invoices (Top 5 by Amount):')
        const topInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: { totalGross: 'desc' },
            select: { invoiceNumber: true, totalGross: true, status: true, documentKind: true }
        })
        topInvoices.forEach(inv => {
            console.log(`   - #${inv.invoiceNumber}: €${Number(inv.totalGross).toFixed(2)} (${inv.status})`)
        })

        console.log('\n🔍 Sample Invoices (Bottom 5 by Amount):')
        const bottomInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: { totalGross: 'asc' },
            select: { invoiceNumber: true, totalGross: true, status: true, documentKind: true }
        })
        bottomInvoices.forEach(inv => {
            console.log(`   - #${inv.invoiceNumber}: €${Number(inv.totalGross).toFixed(2)} (${inv.status})`)
        })

    } catch (error) {
        console.error('❌ Error during diagnosis:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
