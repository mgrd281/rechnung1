
import { NextResponse } from 'next/server'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { loadInvoicesFromDisk } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'

export async function GET() {
    const result: any = {
        env: {},
        connection: {},
        orders: {},
        storage: {}
    }

    try {
        // 1. Check Env Vars
        result.env = {
            shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
            hasToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
            ok: !!process.env.SHOPIFY_SHOP_DOMAIN && !!process.env.SHOPIFY_ACCESS_TOKEN
        }

        // 2. Test Connection
        const settings = getShopifySettings()
        const api = new ShopifyAPI(settings)

        try {
            const connTest = await api.testConnection()
            result.connection = connTest
        } catch (e: any) {
            result.connection = { success: false, message: e.message }
        }

        // 3. Fetch Orders (Try to fetch last 5)
        try {
            // Use a very simple fetch first
            const orders = await api.getOrders({ limit: 5, status: 'any' })
            result.orders = {
                success: true,
                count: orders.length,
                samples: orders.map(o => ({
                    id: o.id,
                    name: o.name,
                    date: o.created_at,
                    customer: o.customer?.email || 'No Email'
                }))
            }
        } catch (e: any) {
            result.orders = { success: false, error: e.message }
        }

        // 4. Check Storage
        try {
            const invoices = loadInvoicesFromDisk()
            result.storage = {
                ok: true,
                invoiceCount: invoices.length,
                path: process.env.VERCEL ? '/tmp' : 'Local'
            }
        } catch (e: any) {
            result.storage = { ok: false, error: e.message }
        }

        return NextResponse.json(result)

    } catch (error: any) {
        return NextResponse.json({ fatalError: error.message }, { status: 500 })
    }
}
