import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const organization = await prisma.organization.findFirst()
        if (!organization) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

        const settings = await prisma.reviewIncentiveSettings.findUnique({
            where: { organizationId: organization.id }
        })

        // Default settings if none exist
        const defaultSettings = {
            enabled: false,
            discountType: 'percentage',
            discountValue: 10,
            minRating: 4,
            requirePhoto: false,
            validityDays: 30,
            emailSubject: 'Danke für Ihre Bewertung! Hier ist Ihr Gutschein',
            emailBody: 'Vielen Dank für Ihre Bewertung. Als Dankeschön erhalten Sie einen Rabatt auf Ihre nächste Bestellung.'
        }

        return NextResponse.json(settings || defaultSettings)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const organization = await prisma.organization.findFirst()
        if (!organization) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

        const settings = await prisma.reviewIncentiveSettings.upsert({
            where: { organizationId: organization.id },
            update: {
                enabled: body.enabled,
                discountType: body.discountType,
                discountValue: parseFloat(body.discountValue),
                minRating: parseInt(body.minRating),
                requirePhoto: body.requirePhoto,
                validityDays: parseInt(body.validityDays),
                emailSubject: body.emailSubject,
                emailBody: body.emailBody
            },
            create: {
                organizationId: organization.id,
                enabled: body.enabled,
                discountType: body.discountType,
                discountValue: parseFloat(body.discountValue),
                minRating: parseInt(body.minRating),
                requirePhoto: body.requirePhoto,
                validityDays: parseInt(body.validityDays),
                emailSubject: body.emailSubject,
                emailBody: body.emailBody
            }
        })

        return NextResponse.json({ success: true, settings })
    } catch (error) {
        console.error('Error saving incentive settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
