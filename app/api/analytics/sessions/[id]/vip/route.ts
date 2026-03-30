export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = params.id;
        const { isVip, adminNotes } = await req.json();

        const updatedSession = await prisma.visitorSession.update({
            where: { id: sessionId },
            data: {
                isVip: isVip ?? undefined,
                adminNotes: adminNotes ?? undefined,
            },
            include: { organization: true }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                organizationId: updatedSession.organizationId,
                userId: (session.user as any).id,
                action: isVip ? 'MARK_VIP' : 'UNMARK_VIP',
                entityType: 'VISITOR_SESSION',
                entityId: sessionId,
                details: {
                    isVip,
                    adminNotes,
                    timestamp: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({ success: true, isVip: updatedSession.isVip });
    } catch (error: any) {
        console.error('[VIP Action] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
