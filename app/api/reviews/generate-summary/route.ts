import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Initialize OpenAI
function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set')
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json()

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // 1. Fetch all approved reviews for this product
        const reviews = await prisma.review.findMany({
            where: {
                productId: String(productId),
                status: { in: ['APPROVED', 'PUBLISHED'] },
                content: { not: '' } // Only reviews with text
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 to avoid token limits
        })

        if (reviews.length < 3) {
            return NextResponse.json({ error: 'Not enough reviews to generate summary (min 3)' }, { status: 400 })
        }

        // 2. Prepare prompt
        const reviewsText = reviews.map(r => `- ${r.content} (${r.rating} stars)`).join('\n')
        const prompt = `
        Analyze the following customer reviews for a product and provide a summary.
        
        Reviews:
        ${reviewsText}
        
        Please provide:
        1. A short summary paragraph (max 3 sentences) in German.
        2. A list of up to 5 Pros (in German).
        3. A list of up to 5 Cons (in German).
        
        Format the output as JSON:
        {
            "summary": "...",
            "pros": ["...", "..."],
            "cons": ["...", "..."]
        }
        `

        // 3. Call OpenAI
        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that summarizes product reviews.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error('No content from OpenAI')

        const result = JSON.parse(content)

        // 4. Save to database
        const summary = await prisma.productReviewSummary.upsert({
            where: { productId: String(productId) },
            update: {
                summary: result.summary,
                pros: JSON.stringify(result.pros),
                cons: JSON.stringify(result.cons),
                lastUpdated: new Date()
            },
            create: {
                productId: String(productId),
                summary: result.summary,
                pros: JSON.stringify(result.pros),
                cons: JSON.stringify(result.cons)
            }
        })

        return NextResponse.json({ success: true, summary })

    } catch (error: any) {
        console.error('Error generating summary:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 })
    }
}
