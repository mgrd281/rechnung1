import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.digitalProduct.findMany({ take: 5 })
  console.log('Digital Products:', JSON.stringify(products, null, 2))
  
  const keys = await prisma.licenseKey.findMany({ where: { isUsed: true }, take: 5 })
  console.log('Used Keys:', JSON.stringify(keys, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
