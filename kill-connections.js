const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Attempting to kill idle connections...')
    try {
        // This query attempts to terminate all other connections to the same database
        // It requires high privileges, so it might fail on Xata/Neon free tiers.
        const result = await prisma.$queryRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid() 
      AND datname = current_database()
      AND state = 'idle';
    `)
        console.log('Result:', result)
        console.log('Successfully requested termination of idle connections.')
    } catch (e) {
        console.error('Failed to kill connections:', e.message)
        console.log('NOTE: This failure is expected if the database user is not a superuser.')
    } finally {
        await prisma.$disconnect()
    }
}

main()
