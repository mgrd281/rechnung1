export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
    try {
        const email = 'mgrdegh@web.de'
        const password = '1532@'
        const saltRounds = 12
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email }
        })

        if (user) {
            // Update password if user exists
            user = await prisma.user.update({
                where: { email },
                data: { passwordHash }
            })
            return NextResponse.json({ message: 'User updated', user })
        }

        // Create Organization first
        const organization = await prisma.organization.create({
            data: {
                name: 'RechnungsProfi',
                slug: 'rechnungsprofi-' + Date.now(),
                address: 'Musterstraße 1',
                zipCode: '12345',
                city: 'Musterstadt'
            }
        })

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

        return NextResponse.json({ message: 'User created', user })

    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
