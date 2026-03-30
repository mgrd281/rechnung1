import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { processVideoSpiderJob } from '@/lib/video-spider/processor';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { urls, spiderCount, mode, watchSeconds, mute, captureProof } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
        }

        let organizationId = (session.user as any).organizationId;

        // Fallback: If not in session, try to fetch from user in DB
        if (!organizationId) {
            const user = await prisma.user.findUnique({
                where: { id: (session.user as any).id },
                select: { organizationId: true }
            });
            organizationId = user?.organizationId;
        }

        // If still no organization, find the first available one (emergency fallback)
        if (!organizationId) {
            const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
            organizationId = firstOrg?.id;
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'User is not linked to any organization. Please contact admin.' }, { status: 400 });
        }

        const job = await (prisma as any).videoSpiderJob.create({
            data: {
                organizationId,
                spiderCount: spiderCount || 5,
                mode: mode || 'VERIFY',
                watchSeconds: watchSeconds || 5,
                mute: mute !== undefined ? mute : true,
                captureProof: captureProof !== undefined ? captureProof : true,
                totalUrls: urls.length,
                status: 'PENDING'
            }
        });

        // Start processing asynchronously
        processVideoSpiderJob(job.id, urls);

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error: any) {
        console.error('Failed to create video spider job:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let organizationId = (session.user as any).organizationId;

    if (!organizationId) {
        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { organizationId: true }
        });
        organizationId = user?.organizationId;
    }

    if (!organizationId) {
        return NextResponse.json({ success: true, jobs: [] });
    }

    const jobs = await (prisma as any).videoSpiderJob.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return NextResponse.json({ success: true, jobs });
}
