export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { processDigitalProductOrder } from '@/lib/digital-products'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id, email, line_items, customer } = body

        const results = []

        for (const item of line_items) {
            if (item.product_id) {
                console.log(`Testing delivery for product ${item.product_id}`)
                try {
                    const result = await processDigitalProductOrder(
                        String(item.product_id),
                        String(id),
                        'TEST-' + String(id), // Test order number
                        email,
                        customer.first_name || 'Test User',
                        item.title
                    )
                    results.push({ productId: item.product_id, result })
                } catch (err) {
                    console.error(err)
                    results.push({ productId: item.product_id, error: String(err) })
                }
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
