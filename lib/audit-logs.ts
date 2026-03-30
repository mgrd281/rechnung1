import { prisma } from './prisma'

export async function logAuditAction(params: {
    organizationId: string
    userId?: string
    action: string
    entityType: string
    entityId?: string
    details?: any
    ipAddress?: string
}) {
    try {
        return await prisma.auditLog.create({
            data: {
                organizationId: params.organizationId,
                userId: params.userId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                details: params.details || {},
                ipAddress: params.ipAddress
            }
        })
    } catch (error) {
        console.error('Failed to log audit action:', error)
    }
}
