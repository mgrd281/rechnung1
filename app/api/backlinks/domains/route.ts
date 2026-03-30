import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const domains = await (prisma as any).referringDomain.findMany({
        where: { organizationId: (session.user as any).organizationId },
        orderBy: { backlinksCount: 'desc' },
        take: 50
    });

    return NextResponse.json({ success: true, domains });
}
