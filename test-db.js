const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.aIContentJob.count()
        console.log('Table exists, count:', count)
    } catch (e) {
        console.error('Error:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
