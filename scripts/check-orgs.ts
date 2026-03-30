
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking Organizations...')

    const orgs = await prisma.organization.findMany()
    console.log(`Found ${orgs.length} organizations:`)
    orgs.forEach(org => {
        console.log(` - ID: ${org.id}, Name: ${org.name}, Slug: ${org.slug}`)
    })

    console.log('\n🔍 Checking Invoice Counts per Organization...')
    for (const org of orgs) {
        const count = await prisma.invoice.count({
            where: { organizationId: org.id }
        })
        console.log(` - Org ${org.id}: ${count} invoices`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
