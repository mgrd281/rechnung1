import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: visitorId } = await props.params;
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organizationId: true, role: true }
        });

        if (!user?.organizationId && user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const visitorSessions = await prisma.visitorSession.findMany({
            where: {
                visitorId,
                organizationId: user?.role === 'ADMIN' ? undefined : user.organizationId
            },
            include: {
                _count: {
                    select: { events: true }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return NextResponse.json({ sessions: visitorSessions });

    } catch (error: any) {
        console.error('[Visitor Sessions API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
