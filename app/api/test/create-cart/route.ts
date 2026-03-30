import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 })
        }

        // 1. Get or Create Organization
        const org = await prisma.organization.findFirst()
        if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

        // 2. Create a Fake Abandoned Cart
        // We set updatedAt to 2 hours ago so the Cron Job picks it up immediately
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

        const cart = await prisma.abandonedCart.create({
            data: {
                organizationId: org.id,
                checkoutId: `TEST-${Date.now()}`,
                email: email,
                cartUrl: 'https://ihr-shop.de/cart',
                totalPrice: 49.99,
                currency: 'EUR',
                lineItems: [
                    { title: 'Test Produkt', quantity: 1, price: 49.99 }
                ],
                updatedAt: twoHoursAgo, // Trick the cron job
                isRecovered: false,
                recoverySent: false
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Test cart created. Now run the cron job endpoint.',
            cartId: cart.id
        })

    } catch (error) {
        console.error('Test Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
