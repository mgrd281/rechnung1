export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
    const auth = requireAuth(req)
    if ('error' in auth) {
        return auth.error
    }

    // Fetch full user to get organizationId
    const dbUser = await prisma.user.findUnique({
        where: { email: auth.user.email },
        include: { organization: true }
    })

    if (!dbUser?.organizationId) {
        return NextResponse.json({ error: 'User has no organization' }, { status: 400 })
    }

    const settings = await prisma.dunningSettings.findUnique({
        where: { organizationId: dbUser.organizationId }
    })

    // Return default settings if none exist
    if (!settings) {
        return NextResponse.json({
            enabled: false,
            reminderDays: 7,
            warning1Days: 3,
            warning2Days: 7,
            finalWarningDays: 7,
            warning1Surcharge: 5.0,
            warning2Surcharge: 3.0,
            finalWarningSurcharge: 3.0
        })
    }

    return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
    try {
        const auth = requireAuth(req)
        if ('error' in auth) {
            console.error('❌ Dunning Settings POST: Auth failed')
            return auth.error
        }

        // Fetch full user to get organizationId
        const dbUser = await prisma.user.findUnique({
            where: { email: auth.user.email },
            include: { organization: true }
        })

        if (!dbUser?.organizationId) {
            console.error('❌ Dunning Settings POST: No organizationId for user', auth.user.email)
            return NextResponse.json({ error: 'User has no organization' }, { status: 400 })
        }

        const body = await req.json()
        console.log('📝 Saving Dunning Settings for org:', dbUser.organizationId, body)

        const settings = await prisma.dunningSettings.upsert({
            where: { organizationId: dbUser.organizationId },
            update: {
                enabled: body.enabled,
                reminderDays: body.reminderDays,
                warning1Days: body.warning1Days,
                warning2Days: body.warning2Days,
                finalWarningDays: body.finalWarningDays,
                warning1Surcharge: body.warning1Surcharge,
                warning2Surcharge: body.warning2Surcharge,
                finalWarningSurcharge: body.finalWarningSurcharge
            },
            create: {
                organizationId: dbUser.organizationId,
                enabled: body.enabled,
                reminderDays: body.reminderDays,
                warning1Days: body.warning1Days,
                warning2Days: body.warning2Days,
                finalWarningDays: body.finalWarningDays,
                warning1Surcharge: body.warning1Surcharge,
                warning2Surcharge: body.warning2Surcharge,
                finalWarningSurcharge: body.finalWarningSurcharge
            }
        })

        console.log('✅ Dunning Settings saved successfully')
        return NextResponse.json(settings)
    } catch (error) {
        console.error('❌ Error saving dunning settings:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
