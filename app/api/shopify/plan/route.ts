export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { plan, shop } = body;

        if (!plan || !shop) {
            return NextResponse.json({ error: 'Plan and shop are required' }, { status: 400 });
        }

        // Find organization (assuming single tenant or linked by shop)
        // For now, we use the first organization as per previous logic, or we could look up by shopifyConnection if we had it fully linked.
        // Reusing the logic from other endpoints:
        const organization = await prisma.organization.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: organization.id },
            data: { plan }
        });

        return NextResponse.json({ success: true, plan: updatedOrg.plan });

    } catch (error) {
        console.error('Error updating plan:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }
}
