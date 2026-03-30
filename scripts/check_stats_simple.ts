
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabaseStats() {
    try {
        const invoiceCount = await prisma.invoice.count()
        const orderCount = await prisma.order.count()
        const customerCount = await prisma.customer.count()

        console.log('--- Database Stats ---')
        console.log(`Total Invoices: ${invoiceCount}`)
        console.log(`Total Orders: ${orderCount}`)
        console.log(`Total Customers: ${customerCount}`)

        const recentInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: { issueDate: 'desc' },
            select: { invoiceNumber: true, issueDate: true, totalGross: true }
        })

        console.log('--- Recent Invoices ---')
        console.log(recentInvoices)

    } catch (error) {
        console.error('Error checking stats:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkDatabaseStats()
