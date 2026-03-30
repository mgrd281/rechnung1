export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { SEOEngine } from '@/lib/seo-engine'

import { auth } from "@/lib/auth"
import { SeoScanOptions } from '@/types/seo-types'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        if (!organizationId) {
            return NextResponse.json({ success: false, error: 'No organization linked' }, { status: 400 })
        }

        const body = await req.json()
        const options: SeoScanOptions = {
            scope: body.scope || 'full',
            depth: body.depth || 'standard',
            coreWebVitals: body.coreWebVitals ?? true,
            mobileCheck: body.mobileCheck ?? true,
            customUrls: body.customUrls
        }

        const engine = new SEOEngine(organizationId)
        const report = await engine.performScan(options)

        return NextResponse.json({
            success: true,
            report
        })

    } catch (error: any) {
        console.error('API Error: SEO Scan:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Server Error'
        }, { status: 500 })
    }
}
