export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organizationId: true }
        });

        if (!user?.organizationId) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

        const settings = await prisma.securitySettings.findUnique({
            where: { organizationId: user.organizationId }
        });

        return NextResponse.json(settings || { storefrontBlockingEnabled: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { storefrontBlockingEnabled } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organizationId: true }
        });

        if (!user?.organizationId) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

        const settings = await prisma.securitySettings.upsert({
            where: { organizationId: user.organizationId },
            create: {
                organizationId: user.organizationId,
                storefrontBlockingEnabled
            },
            update: {
                storefrontBlockingEnabled
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
