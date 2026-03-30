export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // or db from lib/db
import { auth } from '@/lib/auth';
import crypto from 'crypto'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user || !session.user.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Assuming user is linked to an organization via session or DB lookup
        // If session.user.organizationId is available:
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return new NextResponse('Organization not found', { status: 404 })
        }

        const apiKeys = await prisma.apiKey.findMany({
            where: { organizationId: user.organizationId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                key: true, // We might want to mask this in the future, but plan said show it. 
                // Ideally we only show it once, but for now retrieving list shows it.
                // Wait, best practice is to show only once. But simplistic requirement "Give key to person".
                // Let's show it for now as per "simple" requirement, or mask it partial.
                // User asked "if I give to person". 
                // Let's return full key for now to be user friendly for this specific non-tech user.
                lastUsedAt: true,
                createdAt: true
            }
        })

        return NextResponse.json(apiKeys)
    } catch (error) {
        console.error('Error fetching API keys:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user || !session.user.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { name } = await req.json()

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user || !user.organizationId) {
            return new NextResponse('Organization not found', { status: 404 })
        }

        const key = 'sk_' + crypto.randomBytes(24).toString('hex')

        const newKey = await prisma.apiKey.create({
            data: {
                name: name || 'Unnamed Key',
                key,
                organizationId: user.organizationId
            }
        })

        return NextResponse.json(newKey)
    } catch (error) {
        console.error('Error creating API key:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
