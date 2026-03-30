export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

import { auth } from "@/lib/auth"
import { SeoIssue } from '@/types/seo-types'

import { SEOEngine } from '@/lib/seo-engine'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        if (!organizationId) {
            return NextResponse.json({ success: false, error: 'No organization linked' }, { status: 400 })
        }

        const url = new URL(req.url)
        const severity = url.searchParams.get('severity')
        const category = url.searchParams.get('category')
        const resourceType = url.searchParams.get('resourceType')

        // Fetch live issues by running a quick audit scope
        const engine = new SEOEngine(organizationId)
        const scan = await engine.performScan({
            scope: 'full',
            depth: 'standard',
            coreWebVitals: true,
            mobileCheck: true
        })

        // In a real database implementation, issues would be saved during scan
        // For this architecture, we'll re-run the audit logic to return fresh issues
        // (Note: This is simulated as if fetching from a results table populated by the engine)

        // Let's assume the audit logic is exposed or we simulate the fetch
        // For now, we perform a live scan to return AUTHENTIC Shopify issues
        const products = await (engine as any).shopifyApi.getProducts({ limit: 50 })
        const issues = products.flatMap((p: any) => (engine as any).auditResource('Product', p))

        let filteredIssues = issues
        if (severity) filteredIssues = filteredIssues.filter((i: any) => i.severity === severity)
        if (category) filteredIssues = filteredIssues.filter((i: any) => i.category === category)
        if (resourceType) filteredIssues = filteredIssues.filter((i: any) => i.resourceType === resourceType)

        return NextResponse.json({
            success: true,
            issues: filteredIssues,
            total: filteredIssues.length,
            healthScore: scan.healthScore
        })

    } catch (error: any) {
        console.error('[API] SEO Issues Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
