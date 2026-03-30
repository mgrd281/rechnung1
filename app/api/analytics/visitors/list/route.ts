import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
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

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const visitors = await (prisma as any).visitor.findMany({
            where: {
                organizationId: user?.role === 'ADMIN' ? undefined : user.organizationId
            },
            include: {
                _count: {
                    select: { sessions: true }
                },
                sessions: {
                    orderBy: { startTime: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit,
            skip: offset
        });

        // Enrich with last active session info and basic stats
        const enrichedVisitors = (visitors as any[]).map((v: any) => {
            const lastSession = v.sessions[0];
            return {
                id: v.id,
                visitorToken: v.visitorToken,
                country: v.country,
                deviceType: v.deviceType,
                os: v.os,
                browser: v.browser,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt,
                sessionCount: v._count.sessions,
                lastActiveAt: lastSession?.lastActiveAt || v.updatedAt,
                lifecycleStatus: v.lifecycleStatus,
                notes: v.notes,
                tags: v.tags
            };
        });

        const total = await (prisma as any).visitor.count({
            where: { organizationId: user?.role === 'ADMIN' ? undefined : user.organizationId }
        });

        return NextResponse.json({
            visitors: enrichedVisitors,
            pagination: { total, limit, offset }
        });

    } catch (error: any) {
        console.error('[Visitor List API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
