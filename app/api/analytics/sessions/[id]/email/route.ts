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

        const visitorSessionId = params.id;
        const { templateId } = await req.json();

        const visitorSession = await prisma.visitorSession.findUnique({
            where: { id: visitorSessionId },
            include: { organization: true }
        });

        if (!visitorSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                organizationId: visitorSession.organizationId,
                userId: (session.user as any).id,
                action: 'PREPARE_EMAIL',
                entityType: 'VISITOR_SESSION',
                entityId: visitorSessionId,
                details: {
                    templateId,
                    timestamp: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'E-Mail Entwurf wurde vorbereitet.'
        });
    } catch (error: any) {
        console.error('[Email Action] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
