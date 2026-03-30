import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadInvoicesFromDisk, loadCustomersFromDisk, loadUsersFromDisk } from '@/lib/server-storage'
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

export async function GET() {
    const report: any = {
        timestamp: new Date().toISOString(),
        storage: {},
        shopify: { status: 'unknown' },
        system: {
            nodeEnv: process.env.NODE_ENV,
            cwd: process.cwd(),
        }
    }

    // 1. Check Storage Files
    try {
        const storageDir = path.join(process.cwd(), 'user-storage')

        const checkFile = (filename: string, loader: () => any[]) => {
            const filePath = path.join(storageDir, filename)
            const exists = fs.existsSync(filePath)
            let stats = null
            let count = 0
            let error = null

            if (exists) {
                try {
                    const fileStats = fs.statSync(filePath)
                    stats = {
                        size: (fileStats.size / 1024).toFixed(2) + ' KB',
                        modified: fileStats.mtime.toISOString()
                    }
                    const data = loader()
                    count = Array.isArray(data) ? data.length : 0
                } catch (e) {
                    error = e instanceof Error ? e.message : String(e)
                }
            }

            return { exists, stats, count, error, path: filePath }
        }

        report.storage.invoices = checkFile('invoices.json', loadInvoicesFromDisk)
        report.storage.customers = checkFile('customers.json', loadCustomersFromDisk)
        report.storage.users = checkFile('users.json', loadUsersFromDisk)
        report.storage.shopifySettings = checkFile('shopify-settings.json', () => []) // No loader for settings yet exposed, just check file

    } catch (error) {
        report.storage.error = error instanceof Error ? error.message : String(error)
    }

    // 2. Check Shopify Connection
    try {
        const api = new ShopifyAPI()
        const connection = await api.testConnection()
        report.shopify = {
            status: connection.success ? 'connected' : 'error',
            shop: connection.shop?.name,
            message: connection.message
        }
    } catch (error) {
        report.shopify = {
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
        }
    }

    return NextResponse.json(report)
}
