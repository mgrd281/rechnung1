export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { invoiceId } = body

        if (!invoiceId) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            )
        }

        console.log(`🔄 Attempting to cancel Shopify order for invoice: ${invoiceId}`)

        // Fetch invoice with order details
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                order: true
            }
        })

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        if (!invoice.order || !invoice.order.shopifyOrderId) {
            console.log('⚠️ No Shopify Order ID found for this invoice')
            return NextResponse.json(
                { error: 'No associated Shopify order found' },
                { status: 404 }
            )
        }

        const shopifyOrderId = invoice.order.shopifyOrderId
        console.log(`📦 Found Shopify Order ID: ${shopifyOrderId}`)

        // Initialize Shopify API
        const shopify = new ShopifyAPI()

        // Cancel order
        await shopify.cancelOrder(Number(shopifyOrderId))

        return NextResponse.json({
            success: true,
            message: 'Shopify order cancelled successfully'
        })

    } catch (error) {
        console.error('❌ Error cancelling Shopify order:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
