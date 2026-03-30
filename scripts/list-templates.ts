import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const templates = await prisma.invoiceTemplate.findMany()
    templates.forEach(t => console.log(`${t.id}: ${t.name} (Org: ${t.organizationId})`))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
