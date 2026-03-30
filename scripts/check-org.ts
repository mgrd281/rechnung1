
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const orgs = await prisma.organization.findMany()
    console.log('Organizations:', orgs)

    if (orgs.length === 0) {
        console.log('No organizations found. Creating default...')
        const newOrg = await prisma.organization.create({
            data: {
                name: 'Default Organization',
                slug: 'default-org',
                address: 'Musterstraße 1',
                zipCode: '12345',
                city: 'Musterstadt',
                // email: 'info@example.com' // Assuming email field exists or is optional? Checking schema...
                // Schema says: name, slug, address, zipCode, city, country (default DE). 
                // Let's check schema again to be sure about required fields.
            }
        })
        console.log('Created:', newOrg)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
