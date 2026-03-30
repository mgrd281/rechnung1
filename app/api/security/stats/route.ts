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

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        const [
            blockedUsersTotal,
            blockedIpsTotal,
            blockedUsersToday,
            blockedIpsToday,
            failedLogins24h
        ] = await Promise.all([
            prisma.blockedUser.count({ where: { organizationId } }),
            prisma.blockedIp.count({ where: { organizationId } }),
            prisma.blockedUser.count({
                where: {
                    organizationId,
                    blockedAt: { gte: startOfToday }
                }
            }),
            prisma.blockedIp.count({
                where: {
                    organizationId,
                    createdAt: { gte: startOfToday }
                }
            }),
            prisma.blockedUserAttempt.count({
                where: {
                    organizationId,
                    createdAt: { gte: last24h }
                }
            })
        ])

        const activeBlocks = blockedUsersTotal + blockedIpsTotal
        const blockedToday = blockedUsersToday + blockedIpsToday

        // Calculate risk level based on failed logins
        let riskLevel = 'Low'
        if (failedLogins24h > 50) riskLevel = 'High'
        else if (failedLogins24h > 20) riskLevel = 'Medium'

        return NextResponse.json({
            blockedToday,
            failedLogins24h,
            activeBlocks,
            riskLevel,
            trends: {
                blockedToday: 0, // Placeholder
                failedLogins: 0  // Placeholder
            }
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
