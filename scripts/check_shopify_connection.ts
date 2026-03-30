
const { prisma } = require('./lib/prisma')
const { getShopifySettings } = require('./lib/shopify-settings')

async function checkShopify() {
    try {
        console.log('--- Checking Shopify Connection ---')

        // 1. Check Settings
        const settings = await getShopifySettings()
        console.log('Settings Found:', !!settings)
        console.log('Shop Domain:', settings?.shopUrl)
        console.log('Access Token Present:', !!settings?.accessToken)
        console.log('Sync Enabled:', settings?.autoSync)

        // 2. Check Last Sync Log
        const lastSync = await prisma.syncLog.findFirst({
            orderBy: { finishedAt: 'desc' }
        })
        console.log('Last Sync Log:', lastSync)

        // 3. Check Order Count
        const orderCount = await prisma.invoice.count({
            where: { source: 'shopify' }
        })
        console.log('Shopify Invoices in DB:', orderCount)

    } catch (e) {
        console.error('Error checking Shopify:', e)
    } finally {
        await prisma.$disconnect()
    }
}

checkShopify()
