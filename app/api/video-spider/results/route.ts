import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const results = await (prisma as any).videoSpiderResult.findMany({
        where: { jobId },
        orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, results });
}
