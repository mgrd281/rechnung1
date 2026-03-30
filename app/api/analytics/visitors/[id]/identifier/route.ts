export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: visitorId } = await props.params;
        const { customIdentifier } = await req.json();

        const updatedVisitor = await prisma.visitor.update({
            where: { id: visitorId },
            data: {
                customIdentifier: customIdentifier ?? null,
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                organizationId: updatedVisitor.organizationId,
                userId: (session.user as any).id,
                action: 'UPDATE_VISITOR_ID',
                entityType: 'VISITOR',
                entityId: visitorId,
                details: {
                    newIdentifier: customIdentifier,
                    timestamp: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({
            success: true,
            customIdentifier: updatedVisitor.customIdentifier,
            message: 'Besucher-ID wurde aktualisiert.'
        });
    } catch (error: any) {
        console.error('[Visitor ID Update] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
