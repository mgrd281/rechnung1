import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { jobId, action } = body;

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

        if (action === 'STOP') {
            await (prisma as any).videoSpiderJob.update({
                where: { id: jobId },
                data: { status: 'STOPPED', finishedAt: new Date() }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Action failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
