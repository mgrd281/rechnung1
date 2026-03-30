export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
;
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  const session = await auth();
  //@ts-ignore
  const user = session?.user;

  if (!user || user.role !== 'ADMIN' || !user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await req.json(); // 'approve', 'cancel', 'retry'
    const taskId = params.taskId;

    let updateData = {};
    if (action === 'approve') {
        updateData = { status: 'QUEUED' }; // Move from APPROVAL_REQUIRED to QUEUED
    } else if (action === 'cancel') {
        updateData = { status: 'CANCELLED' };
    } else if (action === 'retry') {
        updateData = { status: 'QUEUED', errorMessage: null };
    } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const task = await prisma.agentTask.update({
        where: { id: taskId, organizationId: user.organizationId },
        data: updateData
    });

    return NextResponse.json(task);

  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
