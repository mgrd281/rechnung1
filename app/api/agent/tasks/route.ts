export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
;
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  //@ts-ignore
  const user = session?.user;

  if (!user || user.role !== 'ADMIN' || !user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await prisma.agentTask.findMany({
        where: {
            organizationId: user.organizationId
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            conversation: true
        },
        take: 20
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
