const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const org = await prisma.organization.findFirst()
    console.log('ORG_ID:', org?.id)
    process.exit(0)
}

main()
