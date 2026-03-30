import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const orgs = await prisma.organization.findMany()
    console.log('Organizations:', JSON.stringify(orgs, null, 2))

    const connections = await prisma.shopifyConnection.findMany({
        include: { organization: true }
    })
    console.log('Shopify Connections:', JSON.stringify(connections, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
