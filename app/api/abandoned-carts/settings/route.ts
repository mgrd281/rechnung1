import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let settings = await prisma.abandonedCartSettings.findUnique({
            where: { organizationId: user.organizationId }
        })

        if (!settings) {
            // Create default settings if they don't exist
            settings = await prisma.abandonedCartSettings.create({
                data: {
                    organizationId: user.organizationId,
                    enabled: false,
                    autoSendDelay: 60,
                    defaultDiscount: 10.0,
                    expiryHours: 24
                }
            })
        }

        return NextResponse.json(settings)

    } catch (error) {
        console.error('Error fetching abandoned cart settings:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const settings = await prisma.abandonedCartSettings.upsert({
            where: { organizationId: user.organizationId },
            update: {
                enabled: body.enabled,
                autoSendDelay: body.autoSendDelay,
                defaultDiscount: body.defaultDiscount,
                expiryHours: body.expiryHours
            },
            create: {
                organizationId: user.organizationId,
                enabled: body.enabled,
                autoSendDelay: body.autoSendDelay,
                defaultDiscount: body.defaultDiscount,
                expiryHours: body.expiryHours
            }
        })

        return NextResponse.json(settings)

    } catch (error) {
        console.error('Error saving abandoned cart settings:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
