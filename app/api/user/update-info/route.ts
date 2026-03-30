export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

import { auth } from "@/lib/auth"
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { user } = session as any

        // Get IP and Country from headers
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const country = request.headers.get('x-vercel-ip-country') || 'unknown'

        // Update user
        // Update user
        // First try to find by ID
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } })

        // If not found, try by email to avoid unique constraint errors on creation
        if (!dbUser) {
            dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        }

        if (dbUser) {
            // Update existing user
            await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                    lastIp: ip,
                    country: country,
                    lastLoginAt: new Date()
                }
            })
        } else {
            // Create new user if not found
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
                    lastIp: ip,
                    country: country,
                    lastLoginAt: new Date()
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating user info:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
