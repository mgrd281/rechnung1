export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id

        // 1. Fetch Draft
        const draft = await prisma.importDraft.findUnique({
            where: { id }
        })

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        // If already ready, just return
        if (draft.status === 'READY' || (draft.data && Object.keys(draft.data as object).length > 0)) {
            return NextResponse.json({ success: true, message: 'Draft already processed', product: draft.data })
        }

        // 2. Perform Scraping (Server-Side Call to our own API functionality)
        // Since we are on the server, we can re-use logic or call the /external endpoint URL?
        // Calling own API via fetch might be flaky with auth/headers in some environments, but OK for now.
        // Better: Import the scraping logic directly if possible.
        // For simplicity to stick to existing patterns, we'll fetch the /external endpoint logic or reuse it.
        // But /external returns a response. 

        // Let's call the external URL. PROD_URL is needed? OR just use localhost/relative if Next.js supports it (it usually doesn't for server components easily without full URL).
        // Safest: Copy the scraping logic here or import a helper.
        // Looking at `app/products/import/page.tsx`, it calls `/api/products/import/external`.

        // Let's assume we can fetch our own API.
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        const host = request.headers.get('host')
        const baseUrl = `${protocol}://${host}`

        console.log(`Processing Draft ${id}: Scraping ${draft.sourceUrl}...`)

        const scrapeRes = await fetch(`${baseUrl}/api/products/import/external`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: draft.sourceUrl })
        })

        if (!scrapeRes.ok) {
            const err = await scrapeRes.json()
            await prisma.importDraft.update({
                where: { id },
                data: { status: 'ERROR' }
            })
            return NextResponse.json({ error: err.error || 'Scraping failed' }, { status: 500 })
        }

        const scrapeData = await scrapeRes.json()
        let product = scrapeData.product

        // 3. AI Enhancement
        try {
            console.log(`Processing Draft ${id}: AI Enhancement...`)
            const aiRes = await fetch(`${baseUrl}/api/ai/enhance-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product })
            })

            if (aiRes.ok) {
                const aiData = await aiRes.json()
                if (aiData.enhancedText) product.description = aiData.enhancedText
                if (aiData.newTitle) product.title = aiData.newTitle
                if (aiData.tags) product.tags = Array.isArray(aiData.tags) ? aiData.tags.join(', ') : aiData.tags
                if (aiData.handle) product.handle = aiData.handle
                if (aiData.metaTitle) product.metaTitle = aiData.metaTitle
                if (aiData.metaDescription) product.metaDescription = aiData.metaDescription
            }
        } catch (e) {
            console.error("AI Enhancement failed", e)
        }

        // 4. Update Draft
        const updatedDraft = await prisma.importDraft.update({
            where: { id },
            data: {
                data: product,
                status: 'READY' // or 'IMPORTED' logic? Usually 'READY' for review.
            }
        })

        return NextResponse.json({ success: true, product: product })

    } catch (error) {
        console.error('Error processing draft:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 })
    }
}
