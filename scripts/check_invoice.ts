
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkInvoice() {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: '#3552' }
        })
        console.log('Invoice #3552:', invoice)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkInvoice()
