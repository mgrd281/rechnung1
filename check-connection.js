const { PrismaClient } = require('@prisma/client')

// Use connection_limit=1 explicitly to try and squeeze in
const url = "postgresql://xata:YnsbHXmNwjT9QSx4pglzb9XI97vy6iaQKCjstRZhQCC16yTb5QOFnVNFc7uQZpCY@rsksfldqap37rbkrgov1ufr8c0.us-east-1.xata.tech:5432/xata?sslmode=require&connection_limit=1"

const prisma = new PrismaClient({
    datasources: {
        db: { url }
    }
})

async function main() {
    console.log('Attempting to connect with limit=1...')
    try {
        // Try a simple count first
        const count = await prisma.invoice.count()
        console.log(`SUCCESS! Found ${count} invoices in the database.`)
        console.log('The data is safe. The issue is purely connection limits on the server.')
    } catch (e) {
        console.log('Connection failed:', e.message)
        if (e.message.includes('Too many database connections')) {
            console.log('CONFIRMED: Database is full of open connections.')
            console.log('ACTION REQUIRED: Update DATABASE_URL in Railway to include &connection_limit=3')
        }
    } finally {
        await prisma.$disconnect()
    }
}

main()
