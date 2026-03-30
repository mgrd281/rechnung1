import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const orgId = 'd050c34b-1578-4162-9a9c-9df97073ea3e'
    const taxRateId = 'd9ca8d4e-a073-4719-a9d7-a2e76591e084'
    const templateId = '1dec1e79-fd80-4f75-be89-101ffe93ff52'

    // 1. Create or Find Customer
    let customer = await prisma.customer.findFirst({
        where: {
            email: 'cauw31zq-e52f3c6c67e2@kaufland-marktplatz.de',
            organizationId: orgId
        }
    })

    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                organizationId: orgId,
                name: 'Jing Brückner',
                email: 'cauw31zq-e52f3c6c67e2@kaufland-marktplatz.de',
                address: 'Schönblick 6',
                zipCode: '89186',
                city: 'Illerrieden',
                country: 'DE',
                type: 'PERSON'
            }
        })
    }

    // 2. Create Invoice
    const totalGross = 249.00
    const totalNet = 209.24 // 249 / 1.19
    const totalTax = 39.76

    const invoice = await prisma.invoice.create({
        data: {
            organizationId: orgId,
            customerId: customer.id,
            invoiceNumber: 'RE-K-MY6GE15',
            orderNumber: 'MY6GE15',
            issueDate: new Date('2026-02-06'),
            serviceDate: new Date('2026-02-06'),
            dueDate: new Date('2026-02-20'),
            totalNet: totalNet,
            totalGross: totalGross,
            totalTax: totalTax,
            currency: 'EUR',
            status: 'PAID',
            templateId: templateId,
            customerName: 'Jing Brückner',
            customerEmail: 'cauw31zq-e52f3c6c67e2@kaufland-marktplatz.de',
            paymentMethod: 'Kaufland Payments',
            items: {
                create: [
                    {
                        description: 'Hugo Boss 1513871 Champion Chronograph 44mm 10ATM',
                        ean: '7613272431538',
                        quantity: 1,
                        unitPrice: totalNet,
                        taxRateId: taxRateId,
                        netAmount: totalNet,
                        grossAmount: totalGross,
                        taxAmount: totalTax,
                        kaufquelleSnapshot: 'Kaufland'
                    }
                ]
            }
        }
    })

    console.log('Invoice created:', JSON.stringify(invoice, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
