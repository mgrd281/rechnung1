
import { prisma } from '@/lib/prisma'
import { getCompanySettings } from '@/lib/company-settings'
import { Prisma } from '@prisma/client'

export async function ensureOrganization() {
    const settings = getCompanySettings()

    // Ensure we have a valid ID
    const orgId = settings.id || 'default-org'

    return await prisma.organization.upsert({
        where: { id: orgId },
        update: {
            name: settings.companyName || 'My Company',
            address: settings.address || '',
            zipCode: settings.zipCode || '',
            city: settings.city || '',
            country: settings.country || 'DE',
            taxId: settings.taxId,
            bankName: settings.bankName,
            iban: settings.iban,
            bic: settings.bic,
        },
        create: {
            id: orgId,
            name: settings.companyName || 'My Company',
            slug: 'default', // Fixed slug for the single organization
            address: settings.address || '',
            zipCode: settings.zipCode || '',
            city: settings.city || '',
            country: settings.country || 'DE',
            taxId: settings.taxId,
            bankName: settings.bankName,
            iban: settings.iban,
            bic: settings.bic,
        }
    })
}

export async function ensureTaxRate(organizationId: string, rate: number) {
    // Check if tax rate exists
    const existing = await prisma.taxRate.findFirst({
        where: {
            organizationId,
            rate: new Prisma.Decimal(rate).div(100) // Store as decimal (e.g. 0.19)
        }
    })

    if (existing) return existing

    // Create new tax rate
    return await prisma.taxRate.create({
        data: {
            organizationId,
            name: `${rate}% MwSt`,
            rate: new Prisma.Decimal(rate).div(100),
            isDefault: rate === 19
        }
    })
}

export async function ensureDefaultTemplate(organizationId: string) {
    const existing = await prisma.invoiceTemplate.findFirst({
        where: { organizationId, isDefault: true }
    })

    if (existing) return existing

    // Create default template
    return await prisma.invoiceTemplate.create({
        data: {
            organizationId,
            name: 'Standard Template',
            htmlContent: '<div>Default Template</div>',
            cssContent: '',
            isDefault: true
        }
    })
}

export async function ensureCustomer(organizationId: string, customerData: any) {
    // Try to find by email if present
    if (customerData.email) {
        const existing = await prisma.customer.findFirst({
            where: {
                organizationId,
                email: customerData.email
            }
        })
        if (existing) return existing
    }

    // Create new customer
    return await prisma.customer.create({
        data: {
            organizationId,
            name: customerData.name,
            email: customerData.email,
            address: customerData.address || '',
            zipCode: customerData.zipCode || '',
            city: customerData.city || '',
            country: customerData.country || 'DE',
        }
    })
}
