import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { ShopifyAPI } from '@/lib/shopify-api'
import { DEFAULT_SHOPIFY_SETTINGS } from '@/lib/shopify-settings'
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if admin from session
        const isAdmin = (session.user as any).isAdmin

        let whereClause = {}

        if (isAdmin) {
            // Admins see all within 30 days
            whereClause = {
                updatedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        } else {
            // Non-admins need an organization and 30 day filter
            const user = await prisma.user.findUnique({
                where: { email: session.user?.email! },
                include: { organization: true }
            })

            if (!user?.organizationId) {
                console.error(`[AbandonedCarts] User ${session.user?.email} has no organization`)
                return NextResponse.json({ error: 'No organization found' }, { status: 404 })
            }
            whereClause = {
                organizationId: user.organizationId,
                updatedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        }

        const carts = await prisma.abandonedCart.findMany({
            where: whereClause,
            include: { organization: { include: { shopifyConnection: true } } },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        // 3. Image Enrichment
        // Collect all unique product IDs whose images we don't have yet, 
        // AND that we haven't tried to enrich in the last 15 minutes.
        const productIds = new Set<string>()
        const enrichmentCooloff = 15 * 60 * 1000 // 15 minutes
        const now = Date.now()

        // Internal Image Cache (pre-fetch from what we already have in the DB)
        const productImageMap: Record<string, string> = {}

        carts.forEach(cart => {
            const castCart = cart as any
            const allItems = [...(Array.isArray(castCart.lineItems) ? castCart.lineItems : []), ...(Array.isArray(castCart.removedItems) ? castCart.removedItems : [])]
            allItems.forEach(item => {
                const itemImg = item.image?.src || (typeof item.image === 'string' ? item.image : null)
                if (item.product_id && itemImg) {
                    productImageMap[item.product_id.toString()] = itemImg
                }
            })

            const lastAttempt = castCart.lastEnrichmentAttempt ? new Date(castCart.lastEnrichmentAttempt).getTime() : 0
            const isCoolingOff = (now - lastAttempt) < enrichmentCooloff

            if (isCoolingOff) return

            allItems.forEach(item => {
                const hasImage = item.image?.src || (typeof item.image === 'string' && item.image.length > 0)
                if (item.product_id && !hasImage) {
                    if (!productImageMap[item.product_id.toString()]) {
                        productIds.add(item.product_id.toString())
                    }
                }
            })
        })

        // FIRST PASS: Enrich using local cache (no API needed)
        let totalLocalUpdates = 0
        for (const cart of carts) {
            const castCart = cart as any
            let cartModified = false

            const processItems = (items: any[]) => {
                items.forEach(item => {
                    const hasImage = item.image?.src || (typeof item.image === 'string' && item.image.length > 0)
                    if (item.product_id && !hasImage) {
                        const cached = productImageMap[item.product_id.toString()]
                        if (cached) {
                            item.image = { src: cached }
                            cartModified = true
                        }
                    }
                })
            }

            if (Array.isArray(castCart.lineItems)) processItems(castCart.lineItems as any[])
            if (Array.isArray(castCart.removedItems)) processItems(castCart.removedItems as any[])

            if (cartModified) {
                totalLocalUpdates++
                await prisma.abandonedCart.update({
                    where: { id: cart.id },
                    data: {
                        lineItems: castCart.lineItems,
                        removedItems: castCart.removedItems
                    } as any
                })
            }
        }

        if (totalLocalUpdates > 0) {
            log(`Bild-Enrichment (Lokal): ${totalLocalUpdates} Warenkörbe aus Datenbank-Cache aktualisiert.`, 'success')
        }

        // SECOND PASS: Fetch remaining from Shopify
        const remainingToFetch = Array.from(productIds).filter(id => !productImageMap[id])
        const productIdsArray = remainingToFetch.slice(0, 20)

        if (productIdsArray.length > 0 && carts.length > 0) {
            log(`Bild-Enrichment (Shopify): Suche Bilder für ${productIdsArray.length} neue Produkte...`, 'info')
            try {
                const org = (carts[0] as any).organization
                const shopifyConn = org?.shopifyConnection

                if (shopifyConn) {
                    const shopDomain = shopifyConn.shopName.includes('.')
                        ? shopifyConn.shopName
                        : `${shopifyConn.shopName}.myshopify.com`

                    log(`🔗 Bild-Enrichment gestartet für Shop: ${shopDomain}`, 'info')

                    const shopify = new ShopifyAPI({
                        ...DEFAULT_SHOPIFY_SETTINGS,
                        shopDomain,
                        accessToken: shopifyConn.accessToken,
                    })

                    // Fetch products to get images
                    const products = await shopify.getProducts({
                        ids: productIdsArray.join(','),
                        fields: 'id,images'
                    })

                    log(`✅ ${products.length} Produkte von Shopify abgerufen.`, 'success')

                    // Create image map from Shopify results
                    const shopifyImageMap: Record<string, string> = {}
                    products.forEach(p => {
                        const firstImage = p.images?.[0]?.src
                        if (firstImage) {
                            shopifyImageMap[p.id.toString()] = firstImage
                        }
                    })

                    // Map images back to carts
                    for (const cart of carts) {
                        const castCart = cart as any
                        let cartModified = false

                        const processItemsWithMap = (items: any[]) => {
                            items.forEach(item => {
                                const hasImage = item.image?.src || (typeof item.image === 'string' && item.image.length > 0)
                                if (item.product_id && !hasImage) {
                                    const imgSrc = shopifyImageMap[item.product_id.toString()]
                                    if (imgSrc) {
                                        item.image = { src: imgSrc }
                                        cartModified = true
                                    }
                                }
                            })
                        }

                        if (Array.isArray(castCart.lineItems)) processItemsWithMap(castCart.lineItems as any[])
                        if (Array.isArray(castCart.removedItems)) processItemsWithMap(castCart.removedItems as any[])

                        if (cartModified) {
                            try {
                                await prisma.abandonedCart.update({
                                    where: { id: cart.id },
                                    data: {
                                        lineItems: castCart.lineItems,
                                        removedItems: castCart.removedItems,
                                        lastEnrichmentAttempt: new Date()
                                    } as any
                                })
                            } catch (dbErr) {
                                console.error(`[AbandonedCarts] Failed to persist images for cart ${cart.id}:`, dbErr)
                            }
                        } else {
                            // Even if no images found, mark attempt to respect cooldown if there are still missing images
                            const hasIncompleteItems = (castCart.lineItems as any[])?.some(i => i.product_id && !i.image?.src)
                            if (hasIncompleteItems) {
                                try {
                                    await prisma.abandonedCart.update({
                                        where: { id: cart.id },
                                        data: { lastEnrichmentAttempt: new Date() } as any
                                    })
                                } catch (e) { }
                            }
                        }
                    }
                }
            } catch (enrichError) {
                log(`Bild-Enrichment fehlgeschlagen: ${enrichError instanceof Error ? enrichError.message : String(enrichError)}`, 'error')
                console.error('[AbandonedCarts] Image enrichment failed:', enrichError)
            }
        }

        return NextResponse.json({ carts })
    } catch (error) {
        console.error('Error fetching abandoned carts:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
