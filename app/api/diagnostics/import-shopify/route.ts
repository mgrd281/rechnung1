import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';
import { ShopifyAPI } from '@/lib/shopify-api'
import { InvoiceStatus } from '@prisma/client'
import { getShopifySettings } from '@/lib/shopify-settings'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { page_info, limit = 50 } = body

        const api = new ShopifyAPI()

        // Fetch ONE page of orders
        // We need to access the private makeRequest or use a modified getOrders that returns pagination info
        // Since getOrders in the library abstracts this away, we might need to use a direct request here or modify the library.
        // For safety/speed without modifying the library too much, let's use the library's internal logic if possible, 
        // OR just use the raw fetch logic here for this specific "restore" purpose.

        // Let's use a direct fetch approach here to get full control over pagination headers
        const settings = await getShopifySettings()
        const baseUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}`

        const params = new URLSearchParams()
        params.set('limit', limit.toString())
        params.set('status', 'any')

        if (page_info) {
            params.set('page_info', page_info)
        }

        const response = await fetch(`${baseUrl}/orders.json?${params}`, {
            headers: {
                'X-Shopify-Access-Token': settings.accessToken,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Shopify API Error: ${response.statusText}`)
        }

        const data = await response.json()
        const orders = data.orders || []

        // Parse Link header for next page
        const linkHeader = response.headers.get('Link')
        let nextPageInfo = null
        if (linkHeader) {
            const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
            if (match) {
                const url = new URL(match[1])
                nextPageInfo = url.searchParams.get('page_info')
            }
        }

        let importedCount = 0
        let skippedCount = 0

        // 2. Process each order
        for (const order of orders) {
            try {
                // Check if invoice already exists
                const existingInvoice = await prisma.invoice.findFirst({
                    where: {
                        OR: [
                            { invoiceNumber: order.name }, // e.g. #1001
                            { invoiceNumber: order.name.replace('#', '') } // e.g. 1001
                        ]
                    }
                })

                if (existingInvoice) {
                    skippedCount++
                    continue
                }

                // Create Customer if needed
                let customerId = 'legacy-customer'
                if (order.customer) {
                    const customerName = order.customer.first_name
                        ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
                        : (order.customer.email || 'Unknown')

                    const customer = await prisma.customer.upsert({
                        where: {
                            unique_shopify_customer_per_organization: {
                                organizationId: 'default-org-id',
                                shopifyCustomerId: order.customer.email || `shopify-${order.customer.id}`
                            }
                        },
                        update: {},
                        create: {
                            organization: { connect: { id: 'default-org-id' } },
                            name: customerName,
                            email: order.customer.email || '',
                            phone: order.customer.phone || '',
                            address: order.billing_address?.address1 || '',
                            zipCode: order.billing_address?.zip || '',
                            city: order.billing_address?.city || '',
                            shopifyCustomerId: order.customer.email || `shopify-${order.customer.id}`
                        }
                    })
                    customerId = customer.id
                }

                // Create Invoice
                await prisma.invoice.create({
                    data: {
                        invoiceNumber: order.name,
                        issueDate: new Date(order.created_at),
                        dueDate: new Date(order.created_at), // Default to creation date
                        status: (order.financial_status === 'paid' ? 'PAID' : 'PENDING') as InvoiceStatus,
                        totalNet: parseFloat(order.subtotal_price),
                        totalTax: parseFloat(order.total_tax),
                        totalGross: parseFloat(order.total_price),
                        currency: order.currency,
                        organization: { connect: { id: 'default-org-id' } },
                        customer: { connect: { id: customerId } },
                        template: { connect: { id: 'default-template-id' } },
                        items: {
                            create: order.line_items.map((item: any) => ({
                                description: item.title,
                                quantity: item.quantity,
                                unitPrice: parseFloat(item.price),
                                grossAmount: parseFloat(item.price) * item.quantity,
                                netAmount: (parseFloat(item.price) * item.quantity) / 1.19, // Approx
                                taxAmount: (parseFloat(item.price) * item.quantity) - ((parseFloat(item.price) * item.quantity) / 1.19), // Approx
                                taxRate: {
                                    connectOrCreate: {
                                        where: { organizationId_name: { organizationId: 'default-org-id', name: 'Standard' } },
                                        create: { organizationId: 'default-org-id', name: 'Standard', rate: 0.19 }
                                    }
                                }
                            }))
                        }
                    }
                })
                importedCount++
            } catch (e) {
                console.error(`Failed to import order ${order.name}:`, e)
            }
        }

        return NextResponse.json({
            success: true,
            imported: importedCount,
            skipped: skippedCount,
            next_page_info: nextPageInfo,
            has_more: !!nextPageInfo
        })

    } catch (error: any) {
        console.error('Shopify Import Error:', error)
        return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
    }
}
