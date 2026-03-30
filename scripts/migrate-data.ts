
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting migration...')

    // 1. Create Default Organization
    console.log('Creating/Finding Default Organization...')
    let org = await prisma.organization.findFirst({
        where: { slug: 'default-org' }
    })

    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'My Organization',
                slug: 'default-org',
                address: 'Musterstraße 1',
                zipCode: '12345',
                city: 'Musterstadt',
                country: 'DE'
            }
        })
        console.log('Created Default Organization:', org.id)
    } else {
        console.log('Found Default Organization:', org.id)
    }

    // 2. Create Admin User
    console.log('Creating Admin User...')
    const adminEmail = 'mgrdegh@web.de'
    let adminUser = await prisma.user.findUnique({
        where: { email: adminEmail }
    })

    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('1532@', 10)
        adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Admin',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                emailVerified: new Date(),
                organizationId: org.id
            }
        })
        console.log('Created Admin User:', adminUser.id)
    } else {
        console.log('Found Admin User:', adminUser.id)
        // Ensure admin is linked to org
        if (!adminUser.organizationId) {
            await prisma.user.update({
                where: { id: adminUser.id },
                data: { organizationId: org.id }
            })
            console.log('Linked Admin User to Organization')
        }
    }

    // 3. Migrate Customers
    console.log('Migrating Customers...')
    const customersPath = path.join(process.cwd(), 'user-storage', 'customers.json')
    if (fs.existsSync(customersPath)) {
        const customersData = JSON.parse(fs.readFileSync(customersPath, 'utf-8'))
        const customers = customersData.customers || []

        for (const c of customers) {
            // Check if customer already exists (by email or some ID?)
            // The JSON has 'id', but it might not match UUID format or we want to generate new ones.
            // Let's try to find by email if present, otherwise create.
            // Or maybe we should store the old ID?
            // The Prisma schema has `shopifyCustomerId` but these might not be shopify customers.

            // Let's just create them and duplicate if necessary for now, or check by name/email?
            // Checking by name is risky.
            // Let's check if we can map the old ID to something.
            // The Prisma Customer model doesn't have an 'oldId' field.
            // But we can just create them.

            // Wait, if we run this multiple times, we don't want duplicates.
            // Let's use email as unique key if available.

            if (c.email) {
                const existing = await prisma.customer.findFirst({
                    where: {
                        organizationId: org.id,
                        email: c.email
                    }
                })
                if (existing) {
                    console.log(`Customer ${c.email} already exists. Skipping.`)
                    continue
                }
            }

            try {
                await prisma.customer.create({
                    data: {
                        organizationId: org.id,
                        name: c.name || 'Unknown',
                        email: c.email || null,
                        address: c.address || '',
                        zipCode: c.zipCode || '',
                        city: c.city || '',
                        country: c.country || 'DE',
                        // We can't easily preserve the old ID unless we add a field.
                        // But for now let's just import.
                    }
                })
                console.log(`Imported customer: ${c.name}`)
            } catch (e) {
                console.error(`Failed to import customer ${c.name}:`, e)
            }
        }
    } else {
        console.log('No customers.json found.')
    }

    // 4. Migrate Invoices
    console.log('Migrating Invoices...')
    const invoicesPath = path.join(process.cwd(), 'user-storage', 'invoices.json')
    if (fs.existsSync(invoicesPath)) {
        const invoicesData = JSON.parse(fs.readFileSync(invoicesPath, 'utf-8'))
        const invoices = invoicesData.invoices || []

        // We need a default template
        let template = await prisma.invoiceTemplate.findFirst({
            where: { organizationId: org.id }
        })
        if (!template) {
            template = await prisma.invoiceTemplate.create({
                data: {
                    organizationId: org.id,
                    name: 'Default Template',
                    htmlContent: '<div>Invoice</div>',
                    cssContent: '',
                    isDefault: true
                }
            })
        }

        for (const inv of invoices) {
            // Check if invoice exists
            const existing = await prisma.invoice.findFirst({
                where: {
                    organizationId: org.id,
                    invoiceNumber: inv.number
                }
            })

            if (existing) {
                console.log(`Invoice ${inv.number} already exists. Skipping.`)
                continue
            }

            // We need a customer for the invoice.
            // The invoice JSON has embedded customer data.
            // We should try to find or create this customer.
            let customerId: string | undefined

            if (inv.customer) {
                // Try to find by email
                if (inv.customer.email) {
                    const c = await prisma.customer.findFirst({
                        where: { organizationId: org.id, email: inv.customer.email }
                    })
                    if (c) customerId = c.id
                }

                // If not found, create
                if (!customerId) {
                    const newC = await prisma.customer.create({
                        data: {
                            organizationId: org.id,
                            name: inv.customer.name || 'Unknown',
                            email: inv.customer.email || null,
                            address: inv.customer.address || '',
                            zipCode: inv.customer.zip || '',
                            city: inv.customer.city || '',
                            country: inv.customer.countryCode || 'DE'
                        }
                    })
                    customerId = newC.id
                    console.log(`Created new customer for invoice ${inv.number}`)
                }
            }

            if (!customerId) {
                console.warn(`Skipping invoice ${inv.number} because no customer could be determined.`)
                continue
            }

            try {
                const createdInv = await prisma.invoice.create({
                    data: {
                        organizationId: org.id,
                        customerId: customerId,
                        templateId: template.id,
                        invoiceNumber: inv.number,
                        issueDate: new Date(inv.date),
                        dueDate: new Date(inv.dueDate || inv.date),
                        totalNet: inv.subtotal || 0,
                        totalGross: inv.total || 0,
                        totalTax: inv.tax || 0,
                        status: 'PAID', // Assuming imported ones are paid or we can check logic
                        items: {
                            create: (inv.items || []).map((item: any) => ({
                                description: item.title || item.description || 'Item',
                                quantity: item.quantity || 1,
                                unitPrice: item.price || 0,
                                netAmount: (item.price || 0) * (item.quantity || 1),
                                grossAmount: (item.price || 0) * (item.quantity || 1), // Simplified
                                taxAmount: 0, // Simplified
                                taxRate: {
                                    connectOrCreate: {
                                        where: {
                                            organizationId_name: {
                                                organizationId: org.id,
                                                name: 'Standard'
                                            }
                                        },
                                        create: {
                                            organizationId: org.id,
                                            name: 'Standard',
                                            rate: 0,
                                            isDefault: true
                                        }
                                    }
                                }
                            }))
                        }
                    }
                })
                console.log(`Imported invoice ${inv.number}`)
            } catch (e) {
                console.error(`Failed to import invoice ${inv.number}:`, e)
            }
        }
    } else {
        console.log('No invoices.json found.')
    }

    console.log('Migration completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
