import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const taxRates = await prisma.taxRate.findMany()
    console.log('Tax Rates:', JSON.stringify(taxRates, null, 2))

    const templates = await prisma.invoiceTemplate.findMany({
        where: { organizationId: 'd050c34b-1578-4162-9a9c-9df97073ea3e' }
    })
    console.log('Templates:', JSON.stringify(templates, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
