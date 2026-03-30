export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShopifyAPI } from '@/lib/shopify-api'
import { auth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params
        const product = await prisma.digitalProduct.findUnique({
            where: { id },
            include: {
                variantSettings: true,
                _count: {
                    select: { keys: { where: { isUsed: false } } }
                }
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        let shopifyProduct = null
        try {
            const api = new ShopifyAPI()
            shopifyProduct = await api.getProduct(product.shopifyProductId)
        } catch (e) {
            console.error("Failed to fetch shopify product", e)
        }

        return NextResponse.json({ success: true, data: { ...product, shopifyProduct } })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { emailTemplate, title, downloadUrl, buttonText, buttonColor, buttonTextColor, buttonAlignment, downloadButtons, variantSettings } = body

        // Update main product
        const product = await prisma.digitalProduct.update({
            where: { id },
            data: {
                emailTemplate,
                title,
                downloadUrl,
                buttonText,
                buttonColor,
                buttonTextColor,
                buttonAlignment,
                downloadButtons
            }
        })

        // Update variant settings if provided
        if (variantSettings && Array.isArray(variantSettings)) {
            for (const setting of variantSettings) {
                if (setting.shopifyVariantId) {
                    await prisma.digitalProductVariantSetting.upsert({
                        where: {
                            digitalProductId_shopifyVariantId: {
                                digitalProductId: id,
                                shopifyVariantId: setting.shopifyVariantId
                            }
                        },
                        create: {
                            digitalProductId: id,
                            shopifyVariantId: setting.shopifyVariantId,
                            emailTemplate: setting.emailTemplate,
                            downloadButtons: setting.downloadButtons
                        },
                        update: {
                            emailTemplate: setting.emailTemplate,
                            downloadButtons: setting.downloadButtons
                        }
                    })
                }
            }
        }

        return NextResponse.json({ success: true, data: product })
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const session = await auth()
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const { id } = await params

        // Delete all associated keys first
        await prisma.licenseKey.deleteMany({
            where: { digitalProductId: id }
        })

        await prisma.digitalProduct.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
