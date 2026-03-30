import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const kauflandInvoices = await prisma.invoice.findMany({
        where: {
            OR: [
                { invoiceNumber: { contains: 'Kaufland', mode: 'insensitive' } },
                { orderNumber: { contains: 'Kaufland', mode: 'insensitive' } },
                { customerEmail: { contains: 'kaufland', mode: 'insensitive' } }
            ]
        },
        take: 5
    })
    console.log('Kaufland invoices:', JSON.stringify(kauflandInvoices, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
