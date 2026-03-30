
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const orgs = await prisma.organization.findMany()
    console.log('--- Organizations ---')
    orgs.forEach(o => console.log(`ID: ${o.id}, Name: ${o.name}, Slug: ${o.slug}`))

    const connections = await prisma.shopifyConnection.findMany()
    console.log('\n--- Shopify Connections ---')
    connections.forEach(c => console.log(`ID: ${c.id}, shopName: ${c.shopName}, orgId: ${c.organizationId}`))

    const invoices = await prisma.invoice.count()
    console.log('\nInvoice count:', invoices)
}

main().catch(console.error).finally(() => prisma.$disconnect())
