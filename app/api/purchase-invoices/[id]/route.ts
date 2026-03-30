export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const body = await req.json()

        const invoice = await prisma.purchaseInvoice.update({
            where: { id },
            data: {
                invoiceNumber: body.invoiceNumber,
                supplierName: body.supplierName || body.vendorName,
                invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                currency: body.currency,
                netAmount: body.netAmount !== undefined ? parseFloat(body.netAmount) : undefined,
                taxAmount: body.taxAmount !== undefined ? parseFloat(body.taxAmount) : undefined,
                grossAmount: body.grossAmount !== undefined ? parseFloat(body.grossAmount) : undefined,
                status: body.status,
                category: body.category,
                notes: body.notes,
                fileUrl: body.fileUrl,
            }
        })

        return NextResponse.json({ success: true, data: invoice })

    } catch (error: any) {
        console.error(`[Purchase Invoice PATCH] Error ${params.id}:`, error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.purchaseInvoice.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error(`[Purchase Invoice DELETE] Error ${params.id}:`, error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
