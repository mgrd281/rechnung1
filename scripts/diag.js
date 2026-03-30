
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const connection = await prisma.shopifyConnection.findFirst()
    console.log('connection:', connection)

    const org = await prisma.organization.findFirst()
    console.log('org:', org)

    const count = await prisma.order.count()
    console.log('order count:', count)
}

main().catch(console.error).finally(() => prisma.$disconnect())
