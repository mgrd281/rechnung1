export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { parseDeviceInfo } from '@/lib/device-detection'

// This webhook handles 'checkouts/create' and 'checkouts/update' topics
export async function POST(req: Request) {
    try {
        const body = await req.text()
        const headerList = await headers()
        const hmac = headerList.get('x-shopify-hmac-sha256')
        const topic = headerList.get('x-shopify-topic')
        const shopDomain = headerList.get('x-shopify-shop-domain')

        console.log(`[Webhook] Received ${topic} from ${shopDomain}`)

        if (!shopDomain) {
            return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 })
        }

        // 1. Verify Organization
        // Try to find the connection with flexible matching
        let connection = await prisma.shopifyConnection.findFirst({
            where: { shopName: shopDomain },
            include: { organization: true }
        })

        // If not found, try matching without .myshopify.com or vice versa
        if (!connection) {
            const domainPart = shopDomain.replace('.myshopify.com', '')
            connection = await prisma.shopifyConnection.findFirst({
                where: {
                    OR: [
                        { shopName: domainPart },
                        { shopName: `${domainPart}.myshopify.com` }
                    ]
                },
                include: { organization: true }
            })
        }

        // If still not found, try SELF-HEALING using Environment Variables
        if (!connection) {
            const envDomain = process.env.SHOPIFY_SHOP_DOMAIN
            const envToken = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_API_KEY

            // Check if Env Var matches the incoming shop (fuzzy match)
            if (envDomain && (shopDomain.includes(envDomain) || envDomain.includes(shopDomain))) {
                console.log('[Webhook] Connection missing in DB, attempting self-healing with Env Vars...')

                // Find default org
                const org = await prisma.organization.findFirst({
                    where: {
                        OR: [
                            { id: 'default-org' },
                            { slug: 'default' }
                        ]
                    }
                }) || await prisma.organization.findFirst()

                if (org && envToken) {
                    try {
                        connection = await prisma.shopifyConnection.create({
                            data: {
                                organizationId: org.id,
                                shopName: shopDomain,
                                accessToken: envToken,
                                scopes: process.env.SCOPES || 'read_orders,write_orders',
                                isActive: true
                            },
                            include: { organization: true }
                        })
                        console.log('[Webhook] Self-healing successful! Created connection.')
                    } catch (err) {
                        console.error('[Webhook] Self-healing failed:', err)
                    }
                }
            }
        }

        if (!connection) {
            console.error(`[Webhook] No connection found for shop: ${shopDomain}`)
            return NextResponse.json({ error: 'Shop not connected' }, { status: 404 })
        }

        // 2. Verify HMAC (Security) - Skipped for now as per previous logic

        const data = JSON.parse(body)

        // Handle Anonymous Carts (No Email)
        let customerEmail = data.email
        if (!customerEmail) {
            console.log('[Webhook] Anonymous cart detected. Saving with placeholder for visibility.')
            customerEmail = `anonymous-${data.id}@hidden.com`
        }

        // 3. Save or Update Abandoned Cart
        const checkoutId = data.id.toString()
        const cartUrl = data.abandoned_checkout_url
        const totalPrice = data.total_price
        const currency = data.currency
        const lineItems = data.line_items

        // Find existing cart to compare for removals
        const existingCart = await prisma.abandonedCart.findUnique({
            where: {
                organizationId_checkoutId: {
                    organizationId: connection.organizationId,
                    checkoutId: checkoutId
                }
            }
        })

        let removedItems = (existingCart as any)?.removedItems ? ((existingCart as any).removedItems as any[]) : []
        let currentTotalPricePeak = (existingCart as any)?.totalPricePeak ? Number((existingCart as any).totalPricePeak) : 0
        const newTotalPrice = Number(totalPrice)

        if (existingCart && existingCart.lineItems) {
            const oldItems = existingCart.lineItems as any[]
            const newItems = lineItems as any[]

            // Identify removed items (items that were in the cart but aren't anymore)
            oldItems.forEach(oldItem => {
                const STILL_EXISTS = newItems.find(newItem =>
                    (newItem.variant_id && newItem.variant_id === oldItem.variant_id) ||
                    (newItem.product_id === oldItem.product_id && newItem.title === oldItem.title)
                )

                if (!STILL_EXISTS) {
                    // Check if already in removed list
                    const alreadyRemoved = removedItems.find(rm =>
                        (rm.variant_id && rm.variant_id === oldItem.variant_id) ||
                        (rm.product_id === oldItem.product_id && rm.title === oldItem.title)
                    )

                    if (!alreadyRemoved) {
                        removedItems.push({
                            ...oldItem,
                            removedAt: new Date().toISOString(),
                            isRemoved: true
                        })
                    }
                } else if (STILL_EXISTS.quantity < oldItem.quantity) {
                    removedItems.push({
                        ...oldItem,
                        quantity: oldItem.quantity - STILL_EXISTS.quantity,
                        removedAt: new Date().toISOString(),
                        isPartialRemoval: true
                    })
                }
            })
        }

        // Merge enriched images from existing cart back into new lineItems
        const mergedLineItems = (lineItems as any[]).map(newItem => {
            const oldItem = (existingCart?.lineItems as any[])?.find(oi =>
                (oi.variant_id && oi.variant_id === newItem.variant_id) ||
                (oi.product_id === newItem.product_id && oi.title === newItem.title)
            )

            // Keep the image if old one had it and new one doesn't
            if (oldItem?.image && !newItem.image) {
                return { ...newItem, image: oldItem.image }
            }
            return newItem
        })

        // Update Price Peak
        const totalPricePeak = Math.max(currentTotalPricePeak, newTotalPrice)

        // Parse User Agent for Device/OS Detection (Fallback logic)
        // Shopify often puts this in client_details
        const userAgent = data.user_agent || data.client_details?.user_agent || ''
        const sourceName = data.source_name || ''

        console.log(`[Webhook] Raw Data Summary - Shop: ${shopDomain}, Source: ${sourceName}, UA: "${userAgent}"`)
        if (data.client_details) {
            console.log(`[Webhook] Client Details: ${JSON.stringify(data.client_details)}`)
        } else {
            console.log(`[Webhook] Client Details missing in payload`)
        }

        const existingDeviceInfo = (existingCart as any)?.deviceInfo as any

        let deviceInfo = (existingCart as any)?.deviceInfo?.detection_confidence === 'high'
            ? (existingCart as any).deviceInfo
            : { ...parseDeviceInfo(userAgent, sourceName), detection_confidence: 'low' }

        await prisma.abandonedCart.upsert({
            where: {
                organizationId_checkoutId: {
                    organizationId: connection.organizationId,
                    checkoutId: checkoutId
                }
            },
            create: {
                organizationId: connection.organizationId,
                checkoutId: checkoutId,
                checkoutToken: data.token,
                email: customerEmail,
                cartUrl: cartUrl,
                totalPrice: totalPrice,
                totalPricePeak: totalPricePeak,
                currency: currency,
                lineItems: mergedLineItems,
                removedItems: removedItems,
                deviceInfo: deviceInfo,
                isRecovered: false,
                recoverySent: false
            },
            update: {
                // Update details if they changed
                email: customerEmail,
                cartUrl: cartUrl,
                totalPrice: totalPrice,
                totalPricePeak: totalPricePeak,
                lineItems: mergedLineItems,
                removedItems: removedItems,
                deviceInfo: deviceInfo,
                updatedAt: new Date()
            }
        } as any)

        // --- NEW: Session Heartbeat & Linking ---
        const noteAttributes = data.note_attributes || []
        const sessionAttr = noteAttributes.find((attr: any) => attr.name === '_visitor_session_id')
        const visitorAttr = noteAttributes.find((attr: any) => attr.name === '_visitor_token')

        if (sessionAttr?.value) {
            console.log(`[Webhook] Heartbeat: Updating session ${sessionAttr.value} for checkout ${checkoutId}`)
            try {
                await prisma.visitorSession.updateMany({
                    where: {
                        sessionId: sessionAttr.value,
                        organizationId: connection.organizationId
                    },
                    data: {
                        lastActiveAt: new Date(),
                        status: 'ACTIVE',
                        checkoutToken: data.token,
                        cartToken: data.cart_token,
                        purchaseStatus: 'CHECKOUT'
                    }
                })
            } catch (err) {
                console.error('[Webhook] Failed to update session heartbeat:', err)
            }
        }

        console.log(`[Webhook] Saved abandoned cart for ${customerEmail} (Device: ${deviceInfo.os} ${deviceInfo.device})`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Webhook] Error processing checkout webhook:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

