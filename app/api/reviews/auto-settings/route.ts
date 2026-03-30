export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const organization = await prisma.organization.findFirst()
        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const settings = await prisma.autoReviewSettings.findUnique({
            where: { organizationId: organization.id },
            include: { templates: true }
        })

        if (!settings) {
            // Return default settings if not found
            return NextResponse.json({
                enabled: false,
                delayMinutes: 0,
                percentage: 100,
                minRating: 4,
                maxRating: 5,
                templates: []
            })
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Error fetching auto-review settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { enabled, delayMinutes, percentage, minRating, maxRating, templates } = body

        const organization = await prisma.organization.findFirst()
        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Upsert settings
        const settings = await prisma.autoReviewSettings.upsert({
            where: { organizationId: organization.id },
            update: {
                enabled,
                delayMinutes,
                percentage,
                minRating,
                maxRating
            },
            create: {
                organizationId: organization.id,
                enabled,
                delayMinutes,
                percentage,
                minRating,
                maxRating
            }
        })

        // Handle templates
        // 1. Delete existing templates
        await prisma.autoReviewTemplate.deleteMany({
            where: { settingsId: settings.id }
        })

        // 2. Create new templates
        if (templates && templates.length > 0) {
            await prisma.autoReviewTemplate.createMany({
                data: templates.map((t: any) => ({
                    settingsId: settings.id,
                    content: t.content,
                    title: t.title,
                    rating: t.rating,
                    productId: t.productId || null // Handle productId
                }))
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving auto-review settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
