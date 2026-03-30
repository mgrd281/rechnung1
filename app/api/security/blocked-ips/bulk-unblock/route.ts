import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ ok: false, error: 'Nicht autorisiert', code: 'UNAUTHORIZED' }, { status: 401 })
        }

        const { ids } = await req.json()

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({
                ok: false,
                error: 'Mindestens eine ID ist erforderlich',
                code: 'INVALID_INPUT'
            }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
            select: { organizationId: true, id: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({
                ok: false,
                error: 'Keine Organisation gefunden',
                code: 'ORG_NOT_FOUND'
            }, { status: 404 })
        }

        // Delete all specified IPs that belong to this organization
        const result = await prisma.blockedIp.deleteMany({
            where: {
                id: { in: ids },
                organizationId: user.organizationId
            }
        })

        console.log(`[POST /api/security/blocked-ips/bulk-unblock] Removed ${result.count} blocks:`, {
            ids,
            userId: user.id,
            orgId: user.organizationId
        })

        return NextResponse.json({
            ok: true,
            data: { deletedCount: result.count }
        })
    } catch (error: any) {
        console.error('[POST /api/security/blocked-ips/bulk-unblock] Error:', {
            error: error.message,
            stack: error.stack
        })
        return NextResponse.json({
            ok: false,
            error: 'Fehler beim Bulk-Entsperren. Bitte versuchen Sie es erneut.',
            code: 'INTERNAL_ERROR'
        }, { status: 500 })
    }
}
