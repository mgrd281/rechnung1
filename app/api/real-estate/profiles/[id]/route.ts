import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { ensureOrganization } from '@/lib/db-operations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: any }) {
    const { id } = await params
    const authResult = requireAuth(request)
    if ('error' in authResult) return authResult.error

    try {
        const org = await ensureOrganization()
        const profile = await prisma.realEstateSearchProfile.findFirst({
            where: {
                id: id,
                organizationId: org.id
            }
        })

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
        }

        return NextResponse.json(profile)
    } catch (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
    const { id } = await params
    const authResult = requireAuth(request)
    if ('error' in authResult) return authResult.error

    try {
        const org = await ensureOrganization()
        await prisma.realEstateSearchProfile.deleteMany({
            where: {
                id: id,
                organizationId: org.id
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting profile:', error)
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: any }) {
    const { id } = await params
    const authResult = requireAuth(request)
    if ('error' in authResult) return authResult.error

    try {
        const org = await ensureOrganization()
        const body = await request.json()

        // Use updateMany to ensure organization ownership
        const result = await prisma.realEstateSearchProfile.updateMany({
            where: {
                id: id,
                organizationId: org.id
            },
            data: {
                isActive: body.isActive,
                name: body.name,
                city: body.city,
                zipCode: body.zipCode,
                district: body.district,
                transactionType: body.transactionType,
                propertyType: body.propertyType,
                priceMin: body.priceMin !== undefined ? Number(body.priceMin) : undefined,
                priceMax: body.priceMax !== undefined ? Number(body.priceMax) : undefined,
                roomsMin: body.roomsMin !== undefined ? Number(body.roomsMin) : undefined,
                areaMin: body.areaMin !== undefined ? Number(body.areaMin) : undefined,
            }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
