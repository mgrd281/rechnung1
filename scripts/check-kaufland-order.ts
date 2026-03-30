import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const order = await prisma.order.findFirst({
        where: {
            orderNumber: 'MY6GE15'
        },
        include: {
            invoices: true
        }
    })
    console.log('Order found:', JSON.stringify(order, null, 2))

    const invoice = await prisma.invoice.findFirst({
        where: {
            orderNumber: 'MY6GE15'
        }
    })
    console.log('Invoice found:', JSON.stringify(invoice, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
