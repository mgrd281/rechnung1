
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for existing organizations...')
    const orgs = await prisma.organization.findMany()
    console.log(`Found ${orgs.length} organizations.`)

    if (orgs.length === 0) {
        console.log('Creating default organization...')
        const org = await prisma.organization.create({
            data: {
                name: 'My Company',
                slug: 'my-company',
                address: 'Musterstraße 1',
                zipCode: '12345',
                city: 'Musterstadt',
                country: 'Deutschland'
            }
        })
        console.log('Created organization:', org.id)
    } else {
        console.log('Using existing organization:', orgs[0].name)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
