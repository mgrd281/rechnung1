export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }
        const { user } = authResult

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Get organization ID (assuming user is linked to one, or use default)
        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        }) || await prisma.organization.findFirst()

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const where: any = {
            organizationId: organization.id
        }

        if (startDate) {
            where.date = { ...where.date, gte: new Date(startDate) }
        }
        if (endDate) {
            where.date = { ...where.date, lte: new Date(endDate) }
        }

        const incomes = await prisma.additionalIncome.findMany({
            where,
            orderBy: { date: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: incomes,
            debug: { organizationId: organization.id }
        })
    } catch (error) {
        console.error('Error fetching additional incomes:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }
        const { user } = authResult

        const body = await request.json()
        const { date, description, amount, type } = body

        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        }) || await prisma.organization.findFirst()

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const income = await prisma.additionalIncome.create({
            data: {
                organizationId: organization.id,
                date: new Date(date),
                description,
                amount: parseFloat(amount),
                type: type || 'INCOME'
            }
        })

        return NextResponse.json(income)
    } catch (error) {
        console.error('Error creating additional income:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }
        const { user } = authResult

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
        }

        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        }) || await prisma.organization.findFirst()

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Delete multiple additional incomes
        const result = await prisma.additionalIncome.deleteMany({
            where: {
                id: { in: ids },
                organizationId: organization.id
            }
        })

        return NextResponse.json({ success: true, count: result.count })

    } catch (error) {
        console.error('Error deleting additional incomes:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
