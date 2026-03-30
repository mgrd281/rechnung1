export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to get the default organization
async function getDefaultOrganization() {
    const org = await prisma.organization.findFirst()
    if (!org) {
        return await prisma.organization.create({
            data: {
                name: 'Meine Firma',
                slug: 'default-org',
                address: '',
                zipCode: '',
                city: '',
                country: 'DE'
            }
        })
    }
    return org
}

export async function GET() {
    try {
        const org = await getDefaultOrganization()

        const customers = await prisma.customer.findMany({
            where: {
                organizationId: org.id,
                firstPurchaseDiscountSentAt: { not: null }
            },
            select: {
                id: true,
                name: true,
                email: true,
                firstPurchaseDiscountCode: true,
                firstPurchaseDiscountSentAt: true
            },
            orderBy: {
                firstPurchaseDiscountSentAt: 'desc'
            },
            take: 50 // Limit to last 50
        })

        return NextResponse.json(customers)
    } catch (error) {
        console.error('Error fetching discount history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
