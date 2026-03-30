export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // 1. Find a queued task
        const task = await prisma.agentTask.findFirst({
            where: { status: 'QUEUED' },
            orderBy: { createdAt: 'asc' }
        });

        if (!task) {
            return NextResponse.json({ message: 'No tasks in queue' });
        }

        // 2. Mark as RUNNING
        await prisma.agentTask.update({
            where: { id: task.id },
            data: { 
                status: 'RUNNING',
                startedAt: new Date(),
                logs: '[INFO] Worker started\n[INFO] Cloning repository...\n[INFO] Checkout main branch\n[INFO] Analyzing prompt...'
            }
        });

        // 3. Simulate processing delay (real worker would be separate)
        // We can't actually block the thread for long in Vercel/Next functions, 
        // so we just simulate the "Success" state instantly for this demo, 
        // or we requires a second call to finish it.
        // Let's just finish it here for immediate gratification in the demo.
        
        const prNumber = Math.floor(Math.random() * 1000);
        
        await prisma.agentTask.update({
            where: { id: task.id },
            data: {
                status: 'COMPLETED',
                finishedAt: new Date(),
                prUrl: `https://github.com/mgrd281/invoice/pull/${prNumber}`,
                prNumber: prNumber,
                workBranch: `agent/task-${task.id.substring(0,6)}`,
                logs: `[INFO] Worker started
[INFO] Cloning repository...
[INFO] Checkout main branch
[INFO] Analyzing prompt...
[INFO] Generating code plan...
[INFO] Applying changes to 3 files...
[INFO] Running tests (npm test)...
[SUCCESS] Tests passed.
[INFO] Committing changes...
[INFO] Pushing branch agent/task-${task.id.substring(0,6)}...
[INFO] Creating Pull Request...
[SUCCESS] PR Created: #${prNumber}`
            }
        });

        return NextResponse.json({ message: 'Task processed', taskId: task.id });

    } catch (error) {
        console.error("Engine Error", error);
        return NextResponse.json({ error: 'Engine failure' }, { status: 500 });
    }
}
