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

        const [users, ips] = await Promise.all([
            prisma.blockedUser.findMany({ where: { organizationId: user.organizationId } }),
            prisma.blockedIp.findMany({ where: { organizationId: user.organizationId } })
        ]);

        return NextResponse.json({ users, ips });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { ip, email, reason, type } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organizationId: true, id: true }
        });

        if (!user?.organizationId) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

        if (ip) {
            const blocked = await prisma.blockedIp.create({
                data: {
                    ipAddress: ip,
                    reason: reason || 'Suspicious Activity',
                    organizationId: user.organizationId,
                    createdBy: user.id,
                    status: 'active'
                }
            });
            return NextResponse.json(blocked);
        }

        if (email) {
            const blocked = await prisma.blockedUser.create({
                data: {
                    email,
                    reason: reason || 'Security Policy',
                    organizationId: user.organizationId,
                    blockedBy: user.id
                }
            });
            return NextResponse.json(blocked);
        }

        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, type, status, reason } = await req.json();

        if (type === 'ip') {
            const updated = await prisma.blockedIp.update({
                where: { id },
                data: { status, reason }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type');

        if (type === 'ip') {
            await prisma.blockedIp.delete({ where: { id: id! } });
        } else {
            await prisma.blockedUser.delete({ where: { id: id! } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
