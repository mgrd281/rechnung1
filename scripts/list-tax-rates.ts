import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const taxRates = await prisma.taxRate.findMany()
    taxRates.forEach(tr => console.log(`${tr.id}: ${tr.rate}% (${tr.name})`))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
