
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'mgrdegh@web.de'
    const password = '1532@'
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                emailVerified: new Date(), // Auto-verify
                isSuspended: false
            },
            create: {
                email,
                passwordHash: hashedPassword,
                name: 'Admin',
                role: 'ADMIN',
                emailVerified: new Date(),
                isSuspended: false
            },
        })
        console.log(`User ${user.email} created/updated successfully with ADMIN role.`)

        // Verify immediately
        const verifyUser = await prisma.user.findUnique({ where: { email } })
        const isMatch = await bcrypt.compare(password, verifyUser?.passwordHash || '')
        console.log(`Immediate password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`)

    } catch (e) {
        console.error(e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
