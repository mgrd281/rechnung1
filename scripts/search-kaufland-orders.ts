import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const orders = await prisma.order.findMany({
        where: {
            customerEmail: {
                contains: 'kaufland',
                mode: 'insensitive'
            }
        },
        take: 5
    })
    console.log('Orders with kaufland email:', JSON.stringify(orders, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
