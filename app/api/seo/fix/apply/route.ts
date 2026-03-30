export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

import { auth } from "@/lib/auth"

import { AIAutoFixEngine } from '@/lib/seo-fix-engine'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const body = await req.json()
        const { issueId, resourceId, type, currentTitle, description } = body

        if (!issueId || !resourceId) {
            return NextResponse.json({ success: false, error: 'Issue ID and Resource ID are required' }, { status: 400 })
        }

        const engine = new AIAutoFixEngine(organizationId)
        let success = false
        let message = ''

        // Simple routing based on fix type
        if (type === 'title') {
            success = await engine.optimizeProductTitle(resourceId, currentTitle, description || '')
            message = success ? 'SEO-Titel erfolgreich optimiert' : 'Fehler bei der Titel-Optimierung'
        } else if (type === 'alt') {
            const count = await engine.fixMissingAltTexts(resourceId, currentTitle)
            success = count > 0
            message = success ? `${count} Alt-Texte erfolgreich generiert` : 'Keine fehlenden Alt-Texte gefunden'
        }

        return NextResponse.json({
            success,
            message,
            appliedAt: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('[SEO-FIX] Error applying fix:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
