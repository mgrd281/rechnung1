export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
;
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { CommandRouter } from '@/lib/agent/router';
import { AgentRunner } from '@/lib/agent/runner';

const execAsync = promisify(exec);

// Initialize OpenAI (if key exists)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

export async function POST(req: NextRequest) {
  const session = await auth();
  //@ts-ignore
  const user = session?.user;

  if (!user || user.role !== 'ADMIN' || !user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, conversationId } = await req.json();

    // 1. Get or Create Conversation
    let convoId = conversationId;
    if (!convoId) {
        const convo = await prisma.agentConversation.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                title: message.substring(0, 50) + "...",
                status: "ACTIVE"
            }
        });
        convoId = convo.id;
    }

    // 2. Save User Message
    await prisma.agentMessage.create({
        data: {
            conversationId: convoId,
            role: 'user',
            content: message
        }
    });

    // 3. ROUTER & DECISION ENGINE
    const context = { history: [] }; // Ideally fetch history
    const routeResult = await CommandRouter.route(message, context);

    let aiResponseText = "";
    let specialResponse = null; // For Clarification/Task UI

    if (routeResult.type === 'CREATE_TASK') {
        // Create Task immediately
        const task = await prisma.agentTask.create({
            data: {
                organizationId: user.organizationId,
                conversationId: convoId,
                title: routeResult.prompt.substring(0, 60),
                description: routeResult.prompt,
                status: "QUEUED",
                riskLevel: "LOW", // Default
                promptOriginal: message,
                repoOwner: "mgrd281",
                repoName: "invoice",
                baseBranch: "main"
            }
        });

        // Trigger Runner (Fire and Forget)
        AgentRunner.runTask(task.id).catch(console.error);

        aiResponseText = `Task Created: **${task.title}** (#${task.id.substring(0,6)})\nStatus: QUEUED ⏳\n\nI have started working on this. Check the Task Inspector for live updates.`;
        specialResponse = { type: 'TASK_CREATED', taskId: task.id };

    } else if (routeResult.type === 'ASK_CLARIFY') {
        aiResponseText = routeResult.question;
        specialResponse = { type: 'CLARIFICATION', options: routeResult.options };

    } else if (routeResult.type === 'REJECT') {
        aiResponseText = `I cannot perform this action: ${routeResult.reason}`;

    } else if (routeResult.type === 'EXECUTE_TOOL') {
        // Handle sync tools
        aiResponseText = `Running tool: ${routeResult.tool}...`;
        if (routeResult.tool === 'CHECK_STATUS') {
             // Logic to check status
             aiResponseText = "All systems operational. 3 Tasks running.";
        }
    } else {
        // Fallback to LLM (Chat) or Simulator
        if (openai) {
            const projectContext = `
            RUNTIME: ${process.platform}
            PROJECT: Invoice App (Next.js 14)
            `;
            
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: `You are an Autonomous Dev Agent. Current Task: none. 
                      Instructions:
                      1. If user asks code questions, answer helpfuly.
                      2. If user intent is clearly a task, output [CREATE_TASK: title].
                      3. Use [OPEN_URL url] for websites.
                      Context: ${projectContext}` 
                    },
                    { role: "user", content: message }
                ]
            });
            aiResponseText = completion.choices[0].message.content || "No response";
        } else {
            // Simulator
            aiResponseText = "Simulator: I received your message. If you want to start a task, try '/fix something' or paste a URL.";
            
            // Handle legacy simulator processing
            if (message.includes("finder") || message.includes("files")) {
                aiResponseText += "\n[OPEN_FileManager]";
            }
        }
    }


    // 4. Save Assistant Message
    const assistantMsg = await prisma.agentMessage.create({
        data: {
            conversationId: convoId,
            role: 'assistant',
            content: aiResponseText,
            metadata: specialResponse ? JSON.parse(JSON.stringify(specialResponse)) : undefined
        }
    });

    // 5. Create Task if Needed (Mock logic for now, expanding later) - This block is now handled by the router
    // if (detectedTask) {
    //     await prisma.agentTask.create({
    //         data: {
    //             organizationId: user.organizationId,
    //             conversationId: convoId,
    //             title: detectedTask.title,
    //             description: detectedTask.description,
    //             status: detectedTask.status,
    //             riskLevel: "LOW",
    //             promptOriginal: message,
    //             repoOwner: "mgrd281",
    //             repoName: "invoice",
    //             baseBranch: "main"
    //         }
    //     });
    // }

    return NextResponse.json({ 
        conversationId: convoId,
        message: assistantMsg,
        special: specialResponse // Send to frontend for custom UI
    });

  } catch (error) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
