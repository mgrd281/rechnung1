import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'mgrdegh@web.de'
    const password = '1532@'
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    console.log(`Hashing password for ${email}...`)

    // Check if user exists
    let user = await prisma.user.findUnique({
        where: { email }
    })

    if (user) {
        console.log('User exists. Updating password...')
        user = await prisma.user.update({
            where: { email },
            data: { passwordHash }
        })
        console.log('User updated:', user.id)
    } else {
        console.log('User does not exist. Creating...')

        // Create Organization first
        const organization = await prisma.organization.create({
            data: {
                name: 'RechnungsProfi',
                slug: 'rechnungsprofi-' + Date.now(),
                address: 'Musterstraße 1',
                zipCode: '12345',
                city: 'Musterstadt',
                country: 'DE'
            }
        })
        console.log('Organization created:', organization.id)

        // Create User
        user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: 'Mgrdegh Ghazarian',
                role: 'ADMIN',
                organizationId: organization.id,
                emailVerified: new Date()
            }
        })
        console.log('User created:', user.id)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
