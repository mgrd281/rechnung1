export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { organizationId: true }
    });

    let organizationId = user?.organizationId;
    if (!organizationId) {
      const org = await prisma.organization.findFirst();
      organizationId = org?.id;
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { name, email, phone } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name,
        email,
        phone: phone || null,
        visitorToken: `manual_${Date.now()}`
      }
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('[Customers API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 404 });
    }

    const customers = await prisma.customer.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
