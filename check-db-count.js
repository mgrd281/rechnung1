const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://xata:YnsbHXmNwjT9QSx4pglzb9XI97vy6iaQKCjstRZhQCC16yTb5QOFnVNFc7uQZpCY@rsksfldqap37rbkrgov1ufr8c0.us-east-1.xata.tech:5432/xata?sslmode=require&connection_limit=1"
        }
    }
})

async function main() {
    try {
        const invoiceCount = await prisma.invoice.count()
        const productCount = await prisma.digitalProduct.count()

        console.log('--- DB CHECK RESULT ---')
        console.log(`Invoices: ${invoiceCount}`)
        console.log(`Digital Products: ${productCount}`)
        console.log('-----------------------')
    } catch (e) {
        console.error('Error connecting to DB:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
