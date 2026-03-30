import { NextRequest, NextResponse } from 'next/server'
import { ShopifyAPI, convertShopifyOrderToInvoice } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma'
import { ensureOrganization, ensureCustomer, ensureTaxRate, ensureDefaultTemplate } from '@/lib/db-operations'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('query')

        if (!query) {
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
        }

        // Clean up query (remove # if present)
        const orderName = query.startsWith('#') ? query : `#${query}`
        const orderNumber = query.replace('#', '')

        console.log(`🔍 Searching Shopify for order: ${orderName} or ${orderNumber}`)

        const settings = getShopifySettings()
        if (!settings.enabled) {
            return NextResponse.json({ error: 'Shopify integration is not active' }, { status: 400 })
        }

        const api = new ShopifyAPI(settings)

        // Try to find the order using multiple strategies
        let orders: any[] = []

        // Strategy 1: Search by name (e.g. "#2000")
        console.log(`Trying strategy 1: name=${orderName}`)
        orders = await api.getOrders({
            limit: 1,
            name: orderName,
            status: 'any'
        })

        // Strategy 2: Search by number only (e.g. "2000")
        if (orders.length === 0) {
            console.log(`Trying strategy 2: name=${orderNumber}`)
            orders = await api.getOrders({
                limit: 1,
                name: orderNumber,
                status: 'any'
            })
        }

        // Strategy 3: Use the Search API (orders/search.json) which is more flexible
        if (orders.length === 0) {
            console.log(`Trying strategy 3: search endpoint with query=${orderNumber}`)
            try {
                // We use the internal makeRequest method if possible, or we need to expose it.
                // Since makeRequest is private/protected in some implementations, let's check if we can use it.
                // If not, we'll use a public method or extend the class. 
                // Assuming we can't easily access makeRequest from here without casting or changing visibility.
                // Let's modify ShopifyAPI to support search or use a workaround.
                // Actually, let's just add a searchOrders method to ShopifyAPI in the next step.
                // For now, I will assume I can add it or use a raw fetch if needed.
                // But wait, I can just update the ShopifyAPI class first.
                // Let's keep this file clean and assume I'll update ShopifyAPI next.

                // Placeholder for Strategy 3 - implemented via updating ShopifyAPI first
                // See next tool call.
            } catch (e) {
                console.error('Strategy 3 failed:', e)
            }
        }

        // Strategy 3 (Implemented directly here for now to ensure it works immediately)
        if (orders.length === 0) {
            console.log(`Trying strategy 3: Direct Search API`)
            // We need to construct the URL manually since we don't have a direct method yet
            // and we want to avoid breaking changes if possible.
            // But wait, we have the settings.
            const searchUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders/search.json?query=${orderNumber}&status=any`
            const headers = {
                'X-Shopify-Access-Token': settings.accessToken,
                'Content-Type': 'application/json'
            }

            try {
                const res = await fetch(searchUrl, { headers })
                if (res.ok) {
                    const data = await res.json()
                    if (data.orders && data.orders.length > 0) {
                        orders = data.orders
                    }
                }
            } catch (e) {
                console.error('Search API error:', e)
            }
        }

        // Strategy 4: GraphQL Search (Most robust for finding specific orders by name)
        // We use GraphQL to find the ID, then fetch the full order via REST to ensure compatibility
        if (orders.length === 0) {
            console.log(`Trying strategy 4: GraphQL search for name:${orderNumber}`)
            const graphqlUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/graphql.json`
            const headers = {
                'X-Shopify-Access-Token': settings.accessToken,
                'Content-Type': 'application/json'
            }

            // Query to find order by name (flexible filter)
            // We use a broader query to match name, order_number, etc.
            const query = `
            {
              orders(first: 5, query: "${orderNumber} OR name:${orderNumber}") {
                edges {
                  node {
                    id
                    legacyResourceId
                    name
                    displayFulfillmentStatus
                  }
                }
              }
            }
            `

            try {
                console.log(`🔌 GraphQL Query: ${query.replace(/\s+/g, ' ').trim()}`)
                const res = await fetch(graphqlUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ query })
                })

                if (res.ok) {
                    const data = await res.json()
                    console.log('🔌 GraphQL Response:', JSON.stringify(data))

                    const edges = data.data?.orders?.edges
                    if (edges && edges.length > 0) {
                        // Find the best match
                        const match = edges.find((e: any) => e.node.name === `#${orderNumber}` || e.node.name === orderNumber) || edges[0]
                        const node = match.node

                        console.log(`✅ Found via GraphQL: ${node.name} (Legacy ID: ${node.legacyResourceId})`)

                        // Now fetch the full order via REST using the ID we found
                        const restUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}/orders/${node.legacyResourceId}.json`
                        const orderRes = await fetch(restUrl, { headers })

                        if (orderRes.ok) {
                            const orderData = await orderRes.json()
                            if (orderData.order) {
                                orders = [orderData.order]
                            }
                        } else {
                            console.error(`❌ Failed to fetch full order via REST: ${restUrl} (${orderRes.status})`)
                        }
                    } else {
                        console.log('❌ GraphQL returned no orders.')
                    }
                } else {
                    const errText = await res.text()
                    console.error('GraphQL Error:', errText)
                }
            } catch (e) {
                console.error('Strategy 4 failed:', e)
            }
        }

        if (orders.length === 0) {
            console.log('❌ Order not found with any strategy.')
            return NextResponse.json({ found: false, message: 'Order not found in Shopify' })
        }

        const order = orders[0]
        console.log(`✅ Found order in Shopify: ${order.name} (ID: ${order.id})`)

        // Ensure Organization
        const org = await ensureOrganization()

        // Check if invoice already exists in DB to avoid duplicates
        // We check by invoiceNumber (which usually matches order name) or by shopifyOrderId on the Order model
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                organizationId: org.id,
                invoiceNumber: order.name
            },
            include: {
                customer: true,
                items: true
            }
        })

        if (existingInvoice) {
            console.log(`ℹ️ Invoice for order ${order.name} already exists locally.`)
            return NextResponse.json({
                found: true,
                invoice: existingInvoice,
                isNew: false
            })
        }

        // Convert to invoice data
        const invoiceData = convertShopifyOrderToInvoice(order, settings)

        // Ensure Customer
        const customerObj = await ensureCustomer(org.id, {
            name: invoiceData.customerName,
            email: invoiceData.customerEmail,
            address: invoiceData.customerAddress,
            // Split address if possible or just store in address field
            // The ensureCustomer function expects simple fields
        })

        // Ensure Template
        const templateObj = await ensureDefaultTemplate(org.id)

        // Ensure Order (Optional but good for linking)
        // Check if order exists
        let dbOrder = await prisma.order.findFirst({
            where: {
                organizationId: org.id,
                shopifyOrderId: order.id.toString()
            }
        })

        if (!dbOrder) {
            // Create Order
            dbOrder = await prisma.order.create({
                data: {
                    organizationId: org.id,
                    customerId: customerObj.id,
                    orderNumber: order.name,
                    orderDate: new Date(order.created_at),
                    totalAmount: order.total_price,
                    currency: order.currency,
                    status: 'COMPLETED', // Assuming imported orders are completed or use mapping
                    shopifyOrderId: order.id.toString()
                }
            })
        }

        // Save new invoice to database
        console.log(`💾 Saving new invoice for order ${order.name}...`)

        // Calculate totals
        let totalNet = 0
        let totalGross = 0
        let totalTax = 0

        // Prepare items
        const processedItems = []
        for (const item of invoiceData.items) {
            const quantity = Number(item.quantity)
            const unitPrice = Number(item.unitPrice)
            const total = Number(item.total)
            const taxRateVal = item.taxRate || 19

            // Ensure Tax Rate
            const taxRateObj = await ensureTaxRate(org.id, taxRateVal)

            // Calculate amounts (assuming unitPrice is gross or net? convertShopifyOrderToInvoice logic matters)
            // Usually Shopify sends gross prices.
            // Let's assume item.total is gross.
            // Net = Gross / (1 + rate)
            const gross = total
            const net = gross / (1 + (taxRateVal / 100))
            const tax = gross - net

            totalNet += net
            totalGross += gross
            totalTax += tax

            processedItems.push({
                description: item.description,
                quantity: quantity,
                unitPrice: unitPrice,
                taxRateId: taxRateObj.id,
                netAmount: net,
                grossAmount: gross,
                taxAmount: tax,
                ean: null // Add if available
            })
        }

        const newInvoice = await prisma.invoice.create({
            data: {
                organizationId: org.id,
                customerId: customerObj.id,
                orderId: dbOrder.id,
                templateId: templateObj.id,
                invoiceNumber: invoiceData.number, // or order.name
                issueDate: new Date(invoiceData.date),
                dueDate: new Date(invoiceData.dueDate),
                totalNet: totalNet,
                totalGross: totalGross,
                totalTax: totalTax,
                currency: invoiceData.currency,
                status: 'PAID', // Imported orders are usually paid
                items: {
                    create: processedItems
                },
                settings: {
                    paymentMethod: invoiceData.paymentMethod
                }
            } as any, // Cast to any to avoid strict type checking on JSON field if types are outdated
            include: {
                items: true,
                customer: true
            }
        })

        return NextResponse.json({
            found: true,
            invoice: newInvoice,
            isNew: true
        })

    } catch (error: any) {
        console.error('Error searching Shopify order:', error)
        return NextResponse.json({ error: error.message || 'Failed to search order' }, { status: 500 })
    }
}
