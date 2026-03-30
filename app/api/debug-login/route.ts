export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ status: 'User not found' })
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash || '')

        return NextResponse.json({
            status: 'User found',
            email: user.email,
            hasPasswordHash: !!user.passwordHash,
            passwordMatch,
            isSuspended: user.isSuspended,
            role: user.role
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
