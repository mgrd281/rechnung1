
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createInvoicesFromOrders() {
    try {
        console.log('🚀 Starting invoice creation from orders...')

        // Get all orders without invoices
        const ordersWithoutInvoices = await prisma.order.findMany({
            where: {
                invoices: {
                    none: {}
                }
            },
            include: {
                customer: true,
                organization: true
            },
            take: 100 // Process in batches
        })

        console.log(`Found ${ordersWithoutInvoices.length} orders without invoices`)

        let created = 0
        let failed = 0

        for (const order of ordersWithoutInvoices) {
            try {
                // Get default template
                const template = await prisma.invoiceTemplate.findFirst({
                    where: {
                        organizationId: order.organizationId,
                        isDefault: true
                    }
                })

                if (!template) {
                    console.log(`⚠️ No template found for order ${order.orderNumber}, skipping...`)
                    failed++
                    continue
                }

                // Get default tax rate
                let taxRate = await prisma.taxRate.findFirst({
                    where: {
                        organizationId: order.organizationId,
                        isDefault: true
                    }
                })

                if (!taxRate) {
                    taxRate = await prisma.taxRate.create({
                        data: {
                            organizationId: order.organizationId,
                            name: 'MwSt. 19%',
                            rate: 0.19,
                            isDefault: true
                        }
                    })
                }

                // Calculate amounts
                const totalGross = parseFloat(order.totalAmount.toString())
                const totalNet = totalGross / 1.19
                const totalTax = totalGross - totalNet

                // Create invoice
                const invoice = await prisma.invoice.create({
                    data: {
                        organizationId: order.organizationId,
                        customerId: order.customerId,
                        orderId: order.id,
                        templateId: template.id,
                        invoiceNumber: order.orderNumber,
                        issueDate: order.orderDate,
                        dueDate: new Date(order.orderDate.getTime() + 14 * 24 * 60 * 60 * 1000),
                        totalNet: totalNet,
                        totalGross: totalGross,
                        totalTax: totalTax,
                        status: order.status === 'COMPLETED' ? 'PAID' : 'SENT',
                        settings: {
                            paymentMethod: 'Shopify'
                        },
                        items: {
                            create: [{
                                description: `Shopify Order ${order.orderNumber}`,
                                quantity: 1,
                                unitPrice: totalNet,
                                grossAmount: totalGross,
                                netAmount: totalNet,
                                taxAmount: totalTax,
                                taxRateId: taxRate.id
                            }]
                        }
                    }
                })

                console.log(`✅ Created invoice for order ${order.orderNumber}`)
                created++

            } catch (error: any) {
                console.error(`❌ Failed to create invoice for order ${order.orderNumber}:`, error.message)
                failed++
            }
        }

        console.log(`\n📊 Summary:`)
        console.log(`   Created: ${created}`)
        console.log(`   Failed: ${failed}`)
        console.log(`   Total: ${ordersWithoutInvoices.length}`)

    } catch (error) {
        console.error('Fatal error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createInvoicesFromOrders()
