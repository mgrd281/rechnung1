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
    const category = searchParams.get('category')

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
    if (category) {
      where.category = category
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({
      success: true,
      expenses,
      total: expenses.length,
      debug: { organizationId: organization.id }
    })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    const { user } = authResult

    const expenseData = await request.json()

    // Validate required fields
    if (!expenseData.description || !expenseData.supplier || !expenseData.totalAmount) {
      return NextResponse.json(
        { error: 'Description, supplier, and amount are required' },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } }
    }) || await prisma.organization.findFirst()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Generate expense number
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const newExpense = await prisma.expense.create({
      data: {
        organizationId: organization.id,
        expenseNumber,
        date: new Date(expenseData.date || new Date()),
        category: expenseData.category || 'other',
        description: expenseData.description,
        supplier: expenseData.supplier,
        supplierTaxId: expenseData.supplierTaxId || '',
        netAmount: parseFloat(expenseData.netAmount || 0),
        taxRate: parseFloat(expenseData.taxRate || 19),
        taxAmount: parseFloat(expenseData.taxAmount || 0),
        totalAmount: parseFloat(expenseData.totalAmount),
        receiptUrl: expenseData.receiptUrl,
        receiptFileName: expenseData.receiptFileName,
        accountingAccount: expenseData.accountingAccount || '6815',
        costCenter: expenseData.costCenter || 'ADMIN',
        bookingText: expenseData.bookingText || expenseData.description,
      }
    })

    return NextResponse.json({
      success: true,
      expense: newExpense,
      message: 'Expense created successfully'
    })

  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
