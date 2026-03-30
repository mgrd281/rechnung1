import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processBacklinkJob } from '@/lib/backlinks/processor';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { target, mode, crawlLevel, verifyMode } = body;

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
            return NextResponse.json({ error: 'User is not linked to any organization.' }, { status: 400 });
        }

        console.log('API: Creating backlink job for target:', target);

        const job = await (prisma as any).backlinkJob.create({
            data: {
                organizationId,
                target,
                mode: mode || 'DOMAIN',
                crawlLevel: crawlLevel || 'STANDARD',
                verifyMode: verifyMode || 'STRICT',
                status: 'PENDING'
            }
        });

        console.log('API: Job created with ID:', job.id);

        // Run processing in background
        // In a real app, use a queue like BullMQ
        processBacklinkJob(job.id);

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error: any) {
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

    const jobs = await (prisma as any).backlinkJob.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    return NextResponse.json({ success: true, jobs });
}
