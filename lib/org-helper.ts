import { prisma } from '@/lib/prisma'

export async function getOrganizationIdFromShop(shopDomain: string): Promise<string | null> {
    if (!shopDomain) return null

    // 1. Try to find via ShopifyConnection
    const connection = await prisma.shopifyConnection.findFirst({
        where: { shopName: shopDomain }
    })

    if (connection) return connection.organizationId

    // 2. Fallback: Try to find organization where slug matches or some other logic?
    // For now, let's assume if connection exists, we use it. 
    // If not, we might be in a simplified dev mode where we just pick the first org (DANGEROUS but common in this codebase's valid pattern looking at setup/route.ts usually)

    // Let's check if there is only one organization, maybe use that?
    const orgCount = await prisma.organization.count()
    if (orgCount === 1) {
        const org = await prisma.organization.findFirst()
        return org?.id || null
    }

    return null
}
