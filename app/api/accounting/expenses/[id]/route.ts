export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function PUT(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }

        const { user } = authResult
        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }
        const { id } = await params
        const body = await request.json()
        const { date, description, category, netAmount, taxRate, supplier } = body

        // Verify ownership
        const existingExpense = await prisma.expense.findFirst({
            where: {
                id,
                organizationId: organization.id
            }
        })

        if (!existingExpense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        // Calculate totals
        const net = parseFloat(netAmount)
        const tax = parseFloat(taxRate)
        const taxVal = net * (tax / 100)
        const total = net + taxVal

        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: {
                date: new Date(date),
                description,
                category,
                supplier,
                netAmount: net,
                taxRate: tax,
                taxAmount: taxVal,
                totalAmount: total
            }
        })

        return NextResponse.json(updatedExpense)

    } catch (error) {
        console.error('Error updating expense:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }

        const { user } = authResult
        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }
        const { id } = await params

        // Verify ownership
        const existingExpense = await prisma.expense.findFirst({
            where: {
                id,
                organizationId: organization.id
            }
        })

        if (!existingExpense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        await prisma.expense.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
