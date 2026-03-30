export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShopifySettings } from '@/lib/shopify-settings'
import { getOrganizationIdFromShop } from '@/lib/org-helper'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const filter = url.searchParams.get('filter') || 'all' // all, email, ip

        const shopSettings = getShopifySettings()
        const organizationId = await getOrganizationIdFromShop(shopSettings.shopDomain)

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let items: any[] = []

        if (filter === 'all' || filter === 'email') {
            const users = await prisma.blockedUser.findMany({
                where: { organizationId },
                orderBy: { blockedAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    reason: true,
                    blockedBy: true,
                    blockedAt: true,
                    type: true,
                    expiresAt: true,
                    notes: true
                }
            })
            items = [...items, ...users.map(u => ({ ...u, kind: 'email', value: u.email }))]
        }

        if (filter === 'all' || filter === 'ip') {
            const ips = await prisma.blockedIp.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    ipAddress: true,
                    reason: true,
                    createdAt: true,
                    type: true,
                    expiresAt: true,
                    notes: true
                }
            })
            items = [...items, ...ips.map(i => ({
                ...i,
                kind: 'ip',
                value: i.ipAddress,
                blockedAt: i.createdAt,
                blockedBy: 'System' // IPs usually system blocked, or we need to add blockedBy to IP model too
            }))]
        }

        // Sort combined list
        items.sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime())

        return NextResponse.json({ items })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
    }
}
