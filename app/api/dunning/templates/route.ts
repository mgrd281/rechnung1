export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
    const auth = requireAuth(req)
    if ('error' in auth) {
        return auth.error
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: auth.user.email },
        include: { organization: true }
    })

    if (!dbUser?.organizationId) {
        return NextResponse.json({ error: 'User has no organization' }, { status: 400 })
    }

    const templates = await prisma.dunningTemplate.findMany({
        where: { organizationId: dbUser.organizationId }
    })

    return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
    try {
        const auth = requireAuth(req)
        if ('error' in auth) {
            console.error('❌ Dunning Template POST: Auth failed')
            return auth.error
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: auth.user.email },
            include: { organization: true }
        })

        if (!dbUser?.organizationId) {
            console.error('❌ Dunning Template POST: No organizationId for user', auth.user.email)
            return NextResponse.json({ error: 'User has no organization' }, { status: 400 })
        }

        const body = await req.json()
        console.log('📝 Saving Dunning Template:', { level: body.level, subject: body.subject, orgId: dbUser.organizationId })

        const { level, subject, content } = body

        if (!level || !subject) {
            console.error('❌ Dunning Template POST: Missing required fields', body)
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const template = await prisma.dunningTemplate.upsert({
            where: {
                organizationId_level: {
                    organizationId: dbUser.organizationId,
                    level: level
                }
            },
            update: {
                subject,
                content: content || ''
            },
            create: {
                organizationId: dbUser.organizationId,
                level,
                subject,
                content: content || ''
            }
        })

        console.log('✅ Dunning Template saved successfully')
        return NextResponse.json(template)
    } catch (error) {
        console.error('❌ Error saving dunning template:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
