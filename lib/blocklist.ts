import { prisma } from '@/lib/prisma'

export async function isUserBlocked(email: string | null | undefined, organizationId: string): Promise<{ blocked: boolean, reason?: string }> {
    if (!email) return { blocked: false }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Check Exact Email
    const blockedUser = await prisma.blockedUser.findFirst({
        where: {
            organizationId,
            email: { equals: normalizedEmail, mode: 'insensitive' }
        }
    })

    if (blockedUser) {
        return { blocked: true, reason: blockedUser.reason || 'Email blocked' }
    }

    // 2. Check Domain Block (e.g. "@example.com")
    const domain = normalizedEmail.split('@')[1]
    if (domain) {
        const blockedDomain = await prisma.blockedUser.findFirst({
            where: {
                organizationId,
                email: { equals: `@${domain}`, mode: 'insensitive' }
            }
        })

        if (blockedDomain) {
            return { blocked: true, reason: blockedDomain.reason || 'Domain blocked' }
        }
    }

    return { blocked: false }
}

/**
 * Log a blocked user attempt
 */
export async function logBlockedAttempt(params: {
    organizationId: string
    email: string
    attemptType: 'ORDER_CREATE' | 'REFUND_REQUEST' | 'CANCEL_REQUEST'
    orderId?: string
    invoiceId?: string
    ipAddress?: string
    userAgent?: string
    reason?: string
}): Promise<void> {
    try {
        await prisma.blockedUserAttempt.create({
            data: {
                organizationId: params.organizationId,
                email: params.email.trim().toLowerCase(),
                attemptType: params.attemptType,
                orderId: params.orderId,
                invoiceId: params.invoiceId,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                blocked: true,
                reason: params.reason
            }
        })
        console.log(`🚫 Blocked attempt logged: ${params.email} - ${params.attemptType}`)
    } catch (error) {
        console.error('Error logging blocked attempt:', error)
        // Don't throw - logging failure shouldn't break the flow
    }
}

/**
 * Check if user is blocked and log the attempt if they are
 */
export async function checkAndLogBlockedUser(params: {
    email: string | null | undefined
    organizationId: string
    attemptType: 'ORDER_CREATE' | 'REFUND_REQUEST' | 'CANCEL_REQUEST'
    orderId?: string
    invoiceId?: string
    ipAddress?: string
    userAgent?: string
}): Promise<{ blocked: boolean, reason?: string }> {
    const result = await isUserBlocked(params.email, params.organizationId)

    if (result.blocked && params.email) {
        // Log the blocked attempt
        await logBlockedAttempt({
            organizationId: params.organizationId,
            email: params.email,
            attemptType: params.attemptType,
            orderId: params.orderId,
            invoiceId: params.invoiceId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            reason: result.reason
        })
    }

    return result
}
