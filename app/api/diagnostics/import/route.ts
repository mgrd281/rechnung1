import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { filename, offset = 0, limit = 50 } = body

        if (!filename) {
            return NextResponse.json({ error: 'Filename required' }, { status: 400 })
        }

        const storageDir = path.join(process.cwd(), 'user-storage')
        const filePath = path.join(storageDir, filename)

        const fileContent = await readFile(filePath, 'utf-8')
        let data = JSON.parse(fileContent)

        // Handle wrapped JSON (e.g. { invoices: [...] })
        if (!Array.isArray(data) && data.invoices && Array.isArray(data.invoices)) {
            data = data.invoices
        } else if (!Array.isArray(data) && data.customers && Array.isArray(data.customers)) {
            data = data.customers
        }

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: 'Invalid JSON format: Expected an array or object with "invoices" key' }, { status: 400 })
        }

        const chunk = data.slice(offset, offset + limit)
        let processedCount = 0

        // Determine type based on filename or content
        const isInvoices = filename === 'invoices.json' || (chunk.length > 0 && chunk[0].invoiceNumber)
        const isCustomers = filename === 'customers.json' || (chunk.length > 0 && chunk[0].name && !chunk[0].invoiceNumber)

        if (isInvoices) {
            for (const inv of chunk) {
                try {
                    // Skip if no invoice number
                    if (!inv.invoiceNumber) continue

                    // Ensure customer exists
                    let customerId = 'legacy-customer'
                    if (inv.customer) {
                        try {
                            const customer = await prisma.customer.upsert({
                                where: {
                                    unique_shopify_customer_per_organization: {
                                        organizationId: 'default-org-id',
                                        shopifyCustomerId: inv.customer.email || `legacy-${inv.customer.name}`
                                    }
                                },
                                update: {},
                                create: {
                                    organization: { connect: { id: 'default-org-id' } },
                                    name: inv.customer.name || 'Unknown',
                                    email: inv.customer.email,
                                    address: inv.customer.address || '',
                                    zipCode: inv.customer.zipCode || '',
                                    city: inv.customer.city || '',
                                    shopifyCustomerId: inv.customer.email || `legacy-${inv.customer.name}`
                                }
                            })
                            customerId = customer.id
                        } catch (e) {
                            console.error('Customer upsert failed, using default', e)
                        }
                    }

                    // Create Invoice
                    await prisma.invoice.create({
                        data: {
                            invoiceNumber: inv.invoiceNumber,
                            issueDate: new Date(inv.date || inv.issueDate),
                            dueDate: new Date(inv.dueDate || inv.date || new Date()),
                            status: inv.status || 'PAID',
                            totalNet: inv.subtotal || inv.totalNet || 0,
                            totalTax: inv.taxTotal || inv.totalTax || 0,
                            totalGross: inv.total || inv.totalGross || 0,
                            currency: inv.currency || 'EUR',
                            organization: { connect: { id: 'default-org-id' } },
                            customer: { connect: { id: customerId } },
                            template: { connect: { id: 'default-template-id' } },
                            items: {
                                create: (inv.items || []).map((item: any) => ({
                                    description: item.description || 'Item',
                                    quantity: item.quantity || 1,
                                    unitPrice: item.unitPrice || 0,
                                    grossAmount: item.total || item.grossAmount || 0,
                                    netAmount: item.netAmount || (item.total / 1.19) || 0,
                                    taxAmount: item.taxAmount || (item.total - (item.total / 1.19)) || 0,
                                    taxRate: {
                                        connectOrCreate: {
                                            where: { organizationId_name: { organizationId: 'default-org-id', name: 'Standard' } },
                                            create: { organizationId: 'default-org-id', name: 'Standard', rate: 0.19 }
                                        }
                                    }
                                }))
                            }
                        }
                    }).catch(e => {
                        // Ignore duplicates silently
                        if (!e.message.includes('Unique constraint')) {
                            console.error(`Failed to import invoice ${inv.invoiceNumber}:`, e.message)
                        }
                    })
                    processedCount++
                } catch (e) {
                    console.error('Error processing invoice record:', e)
                }
            }
        } else if (isCustomers) {
            for (const cust of chunk) {
                try {
                    await prisma.customer.create({
                        data: {
                            organization: { connect: { id: 'default-org-id' } },
                            name: cust.name,
                            email: cust.email,
                            phone: cust.phone,
                            address: cust.address || '',
                            zipCode: cust.zipCode || '',
                            city: cust.city || '',
                            shopifyCustomerId: cust.shopifyCustomerId || cust.email
                        }
                    }).catch(() => { })
                    processedCount++
                } catch (e) { }
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            total: data.length,
            offset: offset + limit,
            done: offset + limit >= data.length
        })

    } catch (error) {
        console.error('Import error:', error)
        return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }
}
