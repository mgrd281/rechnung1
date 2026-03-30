
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const orders = await prisma.order.findMany({
        orderBy: { orderDate: 'desc' },
        take: 10,
        select: { orderNumber: true, shopifyOrderId: true, status: true, orderDate: true }
    })
    console.log('--- Last 10 Orders in DB ---')
    console.log(JSON.stringify(orders, null, 2))

    const connections = await prisma.shopifyConnection.findMany()
    console.log('\n--- Shopify Connections ---')
    console.log(JSON.stringify(connections, null, 2))

    const settingsFile = './user-storage/shopify-settings.json'
    const fs = require('fs')
    if (fs.existsSync(settingsFile)) {
        console.log('\n--- Shopify Settings File Exists ---')
        const content = fs.readFileSync(settingsFile, 'utf8')
        console.log(content)
    } else {
        console.log('\n--- Shopify Settings File MISSING ---')
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
