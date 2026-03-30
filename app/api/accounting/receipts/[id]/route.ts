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
        const { id } = await params

        const body = await request.json()
        const { description, category, amount, date } = body
        // ... existing code ...

        const organization = await prisma.organization.findFirst({
            where: { users: { some: { id: user.id } } }
        }) || await prisma.organization.findFirst()

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Verify receipt exists and belongs to organization
        const existingReceipt = await prisma.receipt.findFirst({
            where: { id, organizationId: organization.id }
        })

        if (!existingReceipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
        }

        // Update receipt
        const updatedReceipt = await prisma.receipt.update({
            where: { id },
            data: {
                description,
                category,
                amount: amount ? parseFloat(amount) : undefined,
                date: date ? new Date(date) : undefined
            }
        })

        // If amount is provided, create Expense or Income
        if (amount) {
            const amountValue = parseFloat(amount)
            const receiptDate = date ? new Date(date) : existingReceipt.date

            if (category === 'EXPENSE') {
                await prisma.expense.create({
                    data: {
                        organizationId: organization.id,
                        expenseNumber: `EXP-${Date.now()}`,
                        date: receiptDate,
                        category: 'other',
                        description: description || existingReceipt.filename,
                        supplier: 'Beleg-Verarbeitung',
                        netAmount: amountValue,
                        taxRate: 0,
                        taxAmount: 0,
                        totalAmount: amountValue,
                        receiptUrl: existingReceipt.url,
                        receiptFileName: existingReceipt.filename
                    }
                })
            } else if (category === 'INCOME') {
                await prisma.additionalIncome.create({
                    data: {
                        organizationId: organization.id,
                        date: receiptDate,
                        description: description || existingReceipt.filename,
                        amount: amountValue,
                        type: 'INCOME'
                    }
                })
            }
        }

        return NextResponse.json(updatedReceipt)

    } catch (error) {
        console.error('Error updating receipt:', error)
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
        const existingReceipt = await prisma.receipt.findFirst({
            where: {
                id,
                organizationId: organization.id
            }
        })

        if (!existingReceipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
        }

        await prisma.receipt.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting receipt:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
