import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ShopifyAPI } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'

export const dynamic = 'force-dynamic'

interface ContactResult {
    id: string
    source: 'app' | 'invoice' | 'shopify_customer' | 'shopify_order'
    displayName: string
    company?: string
    email?: string
    phone?: string
    address: {
        line1: string
        zip: string
        city: string
        country: string
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q') || ''

        if (query.length < 2) {
            return NextResponse.json({ ok: true, data: { results: [] } })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
            select: { organizationId: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ ok: false, error: 'Organization not found', code: 'ORG_NOT_FOUND' }, { status: 400 })
        }

        const orgId = user.organizationId

        // 1. Search App Customers
        const appCustomers = await prisma.customer.findMany({
            where: {
                organizationId: orgId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ]
            },
            take: 10
        })

        // 2. Search Shopify (if connected)
        let shopifyCustomers: any[] = []
        let shopifyOrders: any[] = []
        let shopifyConnected = false

        try {
            const settings = getShopifySettings()
            if (settings && settings.enabled && settings.accessToken) {
                shopifyConnected = true
                const shopifyApi = new ShopifyAPI(settings)

                // Parallel search for speed
                const [sCustomers, sOrders] = await Promise.all([
                    shopifyApi.searchCustomers(query).catch(e => {
                        console.error('Shopify searchCustomers error:', e)
                        return []
                    }),
                    shopifyApi.searchOrdersFlexible(query).catch(e => {
                        console.error('Shopify searchOrdersFlexible error:', e)
                        return []
                    })
                ])

                shopifyCustomers = sCustomers
                shopifyOrders = sOrders
            }
        } catch (e) {
            console.error('Shopify connection check failed:', e)
        }

        // --- MAPPING & DEDUPLICATION ---
        const resultsMap = new Map<string, ContactResult>()

        // Helper to normalize strings for hash
        const normalize = (s?: string) => s?.toLowerCase().trim() || ''

        // Helper to create a key for deduplication
        const getDedupeKey = (email?: string, name?: string, zip?: string) => {
            if (email && normalize(email)) return normalize(email)
            return `${normalize(name)}|${normalize(zip)}`
        }

        // Helper to add result with priority ranking (App > Invoice/Customer > Shopify > Order)
        const addResult = (result: ContactResult) => {
            const key = getDedupeKey(result.email, result.displayName, result.address.zip)
            const existing = resultsMap.get(key)

            // Priority list: app > ... > shopify_order
            const priority = {
                'app': 4,
                'invoice': 3, // In our current schema, invoice customers are linked to 'Customer' model (App)
                'shopify_customer': 2,
                'shopify_order': 1
            }

            if (!existing || priority[result.source] > priority[existing.source]) {
                resultsMap.set(key, result)
            }
        }

        // 1. Map App Customers
        appCustomers.forEach((c: any) => {
            addResult({
                id: c.id,
                source: 'app',
                displayName: c.name,
                email: c.email || undefined,
                phone: c.phone || undefined,
                address: {
                    line1: c.address,
                    zip: c.zipCode,
                    city: c.city,
                    country: c.country
                }
            })
        })

        // 2. Map Shopify Customers
        shopifyCustomers.forEach((sc: any) => {
            const address = sc.default_address || {}
            addResult({
                id: `shopify_c_${sc.id}`,
                source: 'shopify_customer',
                displayName: `${sc.first_name || ''} ${sc.last_name || ''}`.trim() || sc.email || 'Unbekannt',
                company: sc.default_address?.company || undefined,
                email: sc.email || undefined,
                phone: sc.phone || undefined,
                address: {
                    line1: address.address1 || '',
                    zip: address.zip || '',
                    city: address.city || '',
                    country: address.country_code || 'DE'
                }
            })
        })

        // 3. Map Shopify Orders (derived customers)
        shopifyOrders.forEach((so: any) => {
            const billing = so.billing_address || {}
            addResult({
                id: `shopify_o_${so.id}`,
                source: 'shopify_order',
                displayName: `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || so.email || 'Unbekannt',
                company: billing.company || undefined,
                email: so.email || undefined,
                phone: billing.phone || undefined,
                address: {
                    line1: billing.address1 || '',
                    zip: billing.zip || '',
                    city: billing.city || '',
                    country: billing.country_code || 'DE'
                }
            })
        })

        // Convert Map to Array and sort by source priority (UI will group later)
        const results = Array.from(resultsMap.values())

        return NextResponse.json({
            ok: true,
            data: {
                results,
                shopifyConnected,
                hint: !shopifyConnected ? 'Shopify nicht verbunden' : undefined
            }
        })

    } catch (error: any) {
        console.error('[Contacts Search API] Error:', error)
        return NextResponse.json({ ok: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
