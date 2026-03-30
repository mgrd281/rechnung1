import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { ensureOrganization } from '@/lib/db-operations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const authResult = requireAuth(request)
    if ('error' in authResult) return authResult.error

    try {
        const org = await ensureOrganization()
        const profiles = await prisma.realEstateSearchProfile.findMany({
            where: { organizationId: org.id },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(profiles)
    } catch (error) {
        console.error('Error fetching real estate profiles:', error)
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const authResult = requireAuth(request)
    if ('error' in authResult) return authResult.error

    try {
        const org = await ensureOrganization()
        const body = await request.json()

        const profile = await prisma.realEstateSearchProfile.create({
            data: {
                organizationId: org.id,
                name: body.name,
                city: body.city,
                zipCode: body.zipCode,
                district: body.district,
                transactionType: body.transactionType,
                propertyType: body.propertyType,
                priceMin: body.priceMin ? Number(body.priceMin) : null,
                priceMax: body.priceMax ? Number(body.priceMax) : null,
                roomsMin: body.roomsMin ? Number(body.roomsMin) : null,
                areaMin: body.areaMin ? Number(body.areaMin) : null,
                isActive: true
            }
        })
        return NextResponse.json(profile)
    } catch (error) {
        console.error('Error creating real estate profile:', error)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
}
