import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        // Auth check
        const authResult = requireAuth(req as any)
        if ('error' in authResult) return authResult.error

        // Get Organization (assuming single org or from user context)
        // For now, getting the first org or default one as per previous patterns
        const org = await prisma.organization.findFirst({
            include: {
                vorkasseSettings: true,
                rechnungSettings: true
            }
        })

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        return NextResponse.json({
            vorkasse: org.vorkasseSettings,
            rechnung: org.rechnungSettings
        })

    } catch (error) {
        console.error('Error fetching payment reminder settings:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        // Auth check
        const authResult = requireAuth(req as any)
        if ('error' in authResult) return authResult.error

        const body = await req.json()
        const { vorkasse, rechnung } = body

        // Get Organization
        const org = await prisma.organization.findFirst()
        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Update Vorkasse Settings
        if (vorkasse) {
            await prisma.vorkasseSettings.upsert({
                where: { organizationId: org.id },
                create: {
                    organizationId: org.id,
                    ...vorkasse
                },
                update: {
                    ...vorkasse
                }
            })
        }

        // Update Rechnung Settings
        if (rechnung) {
            await prisma.rechnungSettings.upsert({
                where: { organizationId: org.id },
                create: {
                    organizationId: org.id,
                    ...rechnung
                },
                update: {
                    ...rechnung
                }
            })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error updating payment reminder settings:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
