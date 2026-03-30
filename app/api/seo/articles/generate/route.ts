export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

import { auth } from "@/lib/auth"
import { AIContentStrategist } from '@/lib/ai-content-strategist'

/**
 * API for generating enterprise-level SEO articles via the 7-phase strategist engine.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { topic } = body

        if (!topic) {
            return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
        }

        const organizationId = (session.user as any).organizationId
        const strategist = new AIContentStrategist(organizationId)

        // Generate article (In a real enterprise app, we might use Server-Sent Events for streaming phases)
        console.log(`[CONTENT-STRATEGIST] Generating article for topic: ${topic}`)

        const result = await strategist.generateArticle(topic, (phase, progress) => {
            console.log(`[CONTENT-STRATEGIST] Phase: ${phase}, Progress: ${progress}%`)
        })

        return NextResponse.json({
            success: true,
            article: result
        })

    } catch (error: any) {
        console.error('[CONTENT-STRATEGIST] generation failed:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
