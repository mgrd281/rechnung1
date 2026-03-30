export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShopifySettings } from '@/lib/shopify-settings'
import { getOrganizationIdFromShop } from '@/lib/org-helper'

export async function POST(request: NextRequest) {
    try {
        const { target, kind, reason, type, duration, notes } = await request.json()

        if (!target || !kind) {
            return NextResponse.json({ error: 'Target and kind are required' }, { status: 400 })
        }

        const shopSettings = getShopifySettings()
        const organizationId = await getOrganizationIdFromShop(shopSettings.shopDomain)

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let expiresAt = null
        if (type === 'TEMPORARY' && duration) {
            expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000) // duration in hours
        }

        if (kind === 'email') {
            await prisma.blockedUser.create({
                data: {
                    organizationId,
                    email: target,
                    reason,
                    type: type || 'PERMANENT',
                    expiresAt,
                    notes,
                    blockedBy: 'Admin'
                }
            })
        } else if (kind === 'ip') {
            await prisma.blockedIp.create({
                data: {
                    organizationId,
                    ipAddress: target,
                    reason,
                    type: type || 'PERMANENT',
                    expiresAt,
                    notes
                }
            })
        }

        // Audit Log
        await prisma.auditLog.create({
            data: {
                organizationId,
                action: 'BLOCK_CREATED',
                entityType: kind === 'ip' ? 'BLOCKED_IP' : 'BLOCKED_USER',
                entityId: target,
                details: { reason, type, expiresAt },
                user: { connect: { email: 'admin@system.com' } } // Mock / Connect real user if available in context
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to block target' }, { status: 500 })
    }
}
