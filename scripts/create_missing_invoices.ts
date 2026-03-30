
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
    try {
        // 1. Get Organization
        const org = await prisma.organization.findFirst()
        if (!org) {
            console.error('No organization found.')
            return
        }

        // 2. Get Template
        const template = await prisma.invoiceTemplate.findFirst({
            where: { organizationId: org.id },
        }) || await prisma.invoiceTemplate.findFirst() // Fallback

        if (!template) {
            console.error('No invoice template found.')
            return
        }

        // 3. Get or Create Placeholder Customer
        let customer = await prisma.customer.findFirst({
            where: {
                organizationId: org.id,
                name: 'Manuelle Erfassung'
            }
        })

        if (!customer) {
            // Try to find any customer to use as a fallback if we don't want to create one?
            // Better to create a specific one so it's obvious.
            customer = await prisma.customer.create({
                data: {
                    organizationId: org.id,
                    name: 'Manuelle Erfassung (Bitte ändern)',
                    address: 'Musterstraße 1',
                    zipCode: '12345',
                    city: 'Musterstadt',
                    country: 'DE',
                    email: 'platzhalter@example.com'
                }
            })
            console.log('Created placeholder customer.')
        }

        const missingNumbers = [1001, 3399, 3435]

        for (const num of missingNumbers) {
            const invoiceNumber = num.toString()

            // Try to infer date from neighbors
            let issueDate = new Date()

            // Find previous invoice
            const prev = await prisma.invoice.findFirst({
                where: {
                    organizationId: org.id,
                    invoiceNumber: (num - 1).toString()
                }
            })

            // Find next invoice
            const next = await prisma.invoice.findFirst({
                where: {
                    organizationId: org.id,
                    invoiceNumber: (num + 1).toString()
                }
            })

            if (prev) {
                issueDate = prev.issueDate
            } else if (next) {
                issueDate = next.issueDate
            }

            console.log(`Creating Invoice #${invoiceNumber} with date ${issueDate.toISOString().split('T')[0]}...`)

            await prisma.invoice.create({
                data: {
                    organizationId: org.id,
                    customerId: customer.id,
                    templateId: template.id,
                    invoiceNumber: invoiceNumber,
                    issueDate: issueDate,
                    dueDate: new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 days
                    totalNet: 0,
                    totalGross: 0,
                    totalTax: 0,
                    status: 'DRAFT',
                    items: {
                        create: {
                            description: 'Platzhalter für fehlende Rechnung',
                            quantity: 1,
                            unitPrice: 0,
                            netAmount: 0,
                            grossAmount: 0,
                            taxAmount: 0,
                            taxRate: {
                                connectOrCreate: {
                                    where: { organizationId_name: { organizationId: org.id, name: '0%' } },
                                    create: {
                                        organizationId: org.id,
                                        name: '0%',
                                        rate: 0,
                                        isDefault: false
                                    }
                                }
                            }
                        }
                    }
                }
            })
        }

        console.log('Successfully created missing invoices.')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
