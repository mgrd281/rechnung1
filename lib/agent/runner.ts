
import { prisma } from '@/lib/prisma';

export class AgentRunner {
  
  static async runTask(taskId: string) {
    // 1. Mark Running
    await prisma.agentTask.update({
        where: { id: taskId },
        data: { 
            status: 'RUNNING', 
            startedAt: new Date(),
            logs: "[Runner] Initializing environment...\n[Runner] Cloning repository..." 
        }
    });

    // SIMULATE WORK (Since we are in a limited environment without real persistent Queue workers)
    // In a real production app, this would be a separate Node process or Docker container.
    
    setTimeout(async () => {
        // Step 2: Simulate Planning
        await prisma.agentTask.update({
            where: { id: taskId },
            data: { 
                logs: "[Runner] Analyzing request...\n[Planner] Generated 3 steps.\n[Runner] Creating feature branch..." 
            }
        });
    }, 2000);

    setTimeout(async () => {
        // Step 3: Simulate Execution
        await prisma.agentTask.update({
            where: { id: taskId },
            data: { 
                logs: "[Runner] Executing step 1/3: Modifying files...\n[Runner] Executing step 2/3: Verify Build...\n[Runner] Running tests..." 
            }
        });
    }, 5000);

    setTimeout(async () => {
        // Step 4: Complete & PR
        const mockPrNumber = Math.floor(Math.random() * 1000);
        await prisma.agentTask.update({
            where: { id: taskId },
            data: { 
                status: 'APPROVAL_REQUIRED', // Or COMPLETED depending on flow
                finishedAt: new Date(),
                prUrl: `https://github.com/mgrd281/invoice/pull/${mockPrNumber}`,
                prNumber: mockPrNumber,
                summary: "Changes applied successfully. PR created.",
                logs: "[Runner] Tests Passed.\n[Runner] Pushing branch...\n[Runner] PR Created." 
            }
        });
    }, 8000);
  }
}
