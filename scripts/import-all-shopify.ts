import { ShopifyAPI, convertShopifyOrderToInvoice } from '../lib/shopify-api'
import { getShopifySettings } from '../lib/shopify-settings'
import { saveInvoicesToDisk, loadInvoicesFromDisk } from '../lib/server-storage'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables manually
try {
    const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    envLocal.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^['"]|['"]$/g, '')
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
    console.log('✅ Loaded .env.local manually')
} catch (e) {
    console.warn('⚠️ Could not load .env.local:', e)
}

async function run() {
    console.log('🚀 Starting FULL IMPORT of all Shopify orders...')

    const settings = getShopifySettings()
    if (!settings.shopDomain || !settings.accessToken) {
        console.error('❌ Missing Shopify credentials in settings or environment variables.')
        process.exit(1)
    }

    const api = new ShopifyAPI(settings)

    try {
        // 1. Fetch ALL orders (unlimited)
        // We use a very old date to ensure we get everything
        const allOrders = await api.getOrders({
            limit: 100000, // High limit to trigger pagination loop
            status: 'any',
            financial_status: 'paid', // Only paid orders (invoices)
            created_at_min: '2020-01-01T00:00:00Z' // From beginning of time
        })

        console.log(`📦 Fetched ${allOrders.length} total orders from Shopify.`)

        // 2. Convert to invoices
        const newInvoices = []
        for (const order of allOrders) {
            try {
                // Fetch full customer details for better data
                if (order.customer && order.customer.id) {
                    try {
                        const customerData = await api.getCustomer(order.customer.id)
                        if (customerData) {
                            order.customer = { ...order.customer, ...customerData }
                        }
                    } catch (e) {
                        // Ignore customer fetch errors
                    }
                }

                const invoice = convertShopifyOrderToInvoice(order, settings)
                newInvoices.push(invoice)
            } catch (err) {
                console.error(`❌ Failed to convert order ${order.name}:`, err)
            }
        }

        console.log(`📄 Converted ${newInvoices.length} orders to invoices.`)

        // 3. Save to disk (merge with existing)
        const existingInvoices = loadInvoicesFromDisk()
        let addedCount = 0
        let updatedCount = 0

        for (const newInv of newInvoices) {
            const existingIndex = existingInvoices.findIndex(ex => ex.number === newInv.number || ex.id === newInv.id)

            if (existingIndex >= 0) {
                // Update existing
                existingInvoices[existingIndex] = newInv
                updatedCount++
            } else {
                // Add new
                existingInvoices.push(newInv)
                addedCount++
            }
        }

        saveInvoicesToDisk(existingInvoices)
        console.log(`💾 Saved to disk: ${addedCount} added, ${updatedCount} updated.`)
        console.log(`✅ Total invoices in database: ${existingInvoices.length}`)

    } catch (error: any) {
        console.error('❌ Error during full import:', error)
    }
}

run()
