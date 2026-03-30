const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const orgs = await prisma.organization.findMany()
        console.log('Organizations found:', JSON.stringify(orgs, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
