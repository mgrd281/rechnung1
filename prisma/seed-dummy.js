
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding dummy customer...')

    // 1. Get or create an organization
    let org = await prisma.organization.findFirst()
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Demo Organization',
                slug: 'demo-org',
                address: 'Musterstraße 1',
                zipCode: '12345',
                city: 'Musterstadt',
                country: 'DE'
            }
        })
    }

    // 2. Create Customer
    const customer = await prisma.customer.create({
        data: {
            organizationId: org.id,
            name: 'Max Mustermann',
            email: 'max.mustermann@example.com',
            address: 'Hauptstraße 10',
            zipCode: '10115',
            city: 'Berlin',
            country: 'DE',
            phone: '+49 170 1234567',
            vatId: 'DE123456789'
        }
    })

    console.log('Created customer:', customer.id)

    // 3. Create Template
    let template = await prisma.invoiceTemplate.findFirst({ where: { organizationId: org.id } })
    if (!template) {
        template = await prisma.invoiceTemplate.create({
            data: {
                organizationId: org.id,
                name: 'Default Template',
                htmlContent: '<html><body>Invoice</body></html>',
                cssContent: 'body { font-family: sans-serif; }'
            }
        })
    }

    // 4. Create Invoice
    const invoice = await prisma.invoice.create({
        data: {
            organizationId: org.id,
            customerId: customer.id,
            templateId: template.id,
            invoiceNumber: 'RE-2025-001',
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            totalNet: 100.00,
            totalGross: 119.00,
            totalTax: 19.00,
            status: 'PAID',
            items: {
                create: {
                    description: 'Software Lizenz Pro',
                    quantity: 1,
                    unitPrice: 100.00,
                    netAmount: 100.00,
                    grossAmount: 119.00,
                    taxAmount: 19.00,
                    taxRate: {
                        connectOrCreate: {
                            where: {
                                organizationId_name: {
                                    organizationId: org.id,
                                    name: '19%'
                                }
                            },
                            create: {
                                organizationId: org.id,
                                name: '19%',
                                rate: 0.19
                            }
                        }
                    }
                }
            }
        }
    })

    // 4. Create Payment
    await prisma.payment.create({
        data: {
            invoiceId: invoice.id,
            customerId: customer.id,
            amount: 119.00,
            paymentDate: new Date(),
            method: 'PayPal',
            status: 'COMPLETED'
        }
    })

    // 5. Create Digital Product & Key
    const product = await prisma.digitalProduct.create({
        data: {
            organizationId: org.id,
            shopifyProductId: 'demo-prod-1',
            title: 'Super Software v2.0'
        }
    })

    await prisma.licenseKey.create({
        data: {
            digitalProductId: product.id,
            customerId: customer.id,
            key: 'AAAAA-BBBBB-CCCCC-DDDDD-12345',
            isUsed: true,
            usedAt: new Date()
        }
    })

    // 6. Create Support Ticket
    const ticket = await prisma.supportTicket.create({
        data: {
            organizationId: org.id,
            customerId: customer.id,
            customerEmail: customer.email,
            customerName: customer.name,
            subject: 'Frage zur Installation',
            status: 'OPEN',
            priority: 'HIGH',
            messages: {
                create: [
                    {
                        sender: 'CUSTOMER',
                        content: 'Hallo, ich habe Probleme bei der Installation auf Windows 11.'
                    },
                    {
                        sender: 'AGENT',
                        content: 'Hallo Max, haben Sie Administrator-Rechte?'
                    }
                ]
            }
        }
    })

    // 7. Create Note
    await prisma.customerNote.create({
        data: {
            customerId: customer.id,
            content: 'Kunde ist VIP, immer schnell antworten.',
            author: 'Admin'
        }
    })

    // 8. Create Email (simulated)
    await prisma.emailMessage.create({
        data: {
            customerId: customer.id,
            subject: 'Re: Frage zur Installation',
            content: 'Ja, habe ich. Es geht trotzdem nicht.',
            from: 'Max Mustermann <max.mustermann@example.com>',
            to: 'support@firma.de',
            gmailId: 'msg-12345'
        }
    })

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
