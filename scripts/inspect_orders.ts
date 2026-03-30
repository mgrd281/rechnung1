
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function inspectOrders() {
    try {
        const orders = await prisma.order.findMany({
            take: 5,
            include: {
                invoices: true
            }
        })

        console.log('--- Inspecting First 5 Orders ---')
        orders.forEach((o: any) => {
            console.log(`Order #${o.orderNumber} (ID: ${o.id})`)
            console.log(`  Shopify ID: ${o.shopifyOrderId}`)
            console.log(`  Invoices: ${o.invoices.length}`)
            console.log(`  Created At: ${o.createdAt}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

inspectOrders()
