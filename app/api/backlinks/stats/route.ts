import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session.user as any).organizationId;

    const [
        totalBacklinks,
        referringDomains,
        newLast30Days,
        lostLast30Days,
        dofollowCount,
        totalWithConfidence
    ] = await Promise.all([
        (prisma as any).backlink.count({ where: { organizationId: orgId, status: 'active' } }),
        (prisma as any).referringDomain.count({ where: { organizationId: orgId } }),
        (prisma as any).backlink.count({
            where: {
                organizationId: orgId,
                firstSeenAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
        }),
        (prisma as any).backlink.count({ where: { organizationId: orgId, status: 'lost' } }),
        (prisma as any).backlink.count({ where: { organizationId: orgId, status: 'active', linkType: 'dofollow' } }),
        (prisma as any).backlink.aggregate({
            where: { organizationId: orgId, status: 'active' },
            _avg: { confidenceScore: true }
        })
    ]);

    const stats = {
        totalBacklinks,
        referringDomains,
        newLast30Days,
        lostLast30Days,
        dofollowPercentage: totalBacklinks > 0 ? (dofollowCount / totalBacklinks) * 100 : 0,
        averageConfidence: totalWithConfidence._avg.confidenceScore || 0
    };

    return NextResponse.json({ success: true, stats });
}
