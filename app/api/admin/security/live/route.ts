import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionAuth = await auth();
        if (!sessionAuth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: sessionAuth.user.email! },
            select: { organizationId: true }
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Fetch recent Storefront visits for "Live Events"
        const visits = await prisma.storefrontVisit.findMany({
            where: { organizationId: user.organizationId },
            take: 50,
            orderBy: { lastSeen: 'desc' }
        });

        const formattedEvents = visits.map(visit => ({
            id: visit.id,
            ip: visit.ip,
            path: visit.path,
            time: visit.lastSeen,
            hitCount: visit.hitCount,
            userAgent: visit.userAgent
        }));

        return NextResponse.json(formattedEvents);
    } catch (error: any) {
        console.error('[Live Events API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
