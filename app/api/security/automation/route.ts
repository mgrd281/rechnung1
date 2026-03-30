export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShopifySettings } from '@/lib/shopify-settings'
import { getOrganizationIdFromShop } from '@/lib/org-helper'

export async function GET(request: NextRequest) {
    try {
        const shopSettings = getShopifySettings()
        const organizationId = await getOrganizationIdFromShop(shopSettings.shopDomain)

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const settings = await prisma.securitySettings.findUnique({
            where: { organizationId }
        })

        return NextResponse.json({ settings: settings || {} })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const data = await request.json()
        const shopSettings = getShopifySettings()
        const organizationId = await getOrganizationIdFromShop(shopSettings.shopDomain)

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const settings = await prisma.securitySettings.upsert({
            where: { organizationId },
            update: data,
            create: {
                organizationId,
                ...data
            }
        })

        return NextResponse.json({ settings })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
