export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShopifySettings } from '@/lib/shopify-settings'
import { getOrganizationIdFromShop } from '@/lib/org-helper'

export async function POST(request: NextRequest) {
    try {
        const { url, product, settings } = await request.json()

        if (!url && !product) {
            return NextResponse.json({ error: 'URL or Product data is required' }, { status: 400 })
        }

        // 1. Resolve Organization
        const shopSettings = getShopifySettings()
        const organizationId = await getOrganizationIdFromShop(shopSettings.shopDomain)

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization not found for current shop' }, { status: 404 })
        }

        // Verify Organization exists in DB to prevent foreign key errors
        const orgExists = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true }
        })

        if (!orgExists) {
            return NextResponse.json({ error: 'Organization record mismatch' }, { status: 500 })
        }

        // 2. Create Draft in DB
        // If product is provided, status is READY, otherwise PENDING
        const initialStatus = product ? 'READY' : 'PENDING'

        const draft = await prisma.importDraft.create({
            data: {
                organizationId,
                sourceUrl: url || product?.sourceUrl || 'unknown',
                data: product || {}, // Empty data initially if pending
                settings: settings || {},
                status: initialStatus
            }
        })

        // 3. Analytics (Non-blocking)
        // User Requirement: This MUST be wrapped in try/catch to prevent 500s 
        // if the visitor/organization link fails (FK Constraint).
        try {
            // Placeholder: If you have a trackVisitor() function, call it here.
            // await trackVisitor(request, 'draft_created', { draftId: draft.id });
            console.log('Draft created for org:', organizationId)
        } catch (analyticsError) {
            // Critical: Do NOT fail the request if analytics fails
            console.error('Analytics tracking failed (non-fatal):', analyticsError)
        }

        return NextResponse.json({ success: true, draftId: draft.id, status: initialStatus })

    } catch (error) {
        console.error('Error creating import draft:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to create draft'
        }, { status: 500 })
    }
}
