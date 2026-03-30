import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const invoices = await prisma.invoice.findMany({
        where: {
            customerEmail: {
                contains: 'kaufland',
                mode: 'insensitive'
            }
        },
        take: 5
    })
    console.log('Invoices with kaufland email:', JSON.stringify(invoices, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
