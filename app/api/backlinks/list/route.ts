import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const domain = searchParams.get('domain');

    const where: any = {
        organizationId: (session.user as any).organizationId,
    };

    if (status) where.status = status;
    if (domain) where.sourceDomain = { contains: domain, mode: 'insensitive' };

    const backlinks = await (prisma as any).backlink.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        take: 100
    });

    return NextResponse.json({ success: true, backlinks });
}
