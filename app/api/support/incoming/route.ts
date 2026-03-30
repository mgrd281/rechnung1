export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'

// This endpoint receives webhooks (e.g., from a Gmail script or email parser)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { sender, subject, content, organizationId } = body

        if (!sender || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create Support Ticket
        // Note: In a real multi-tenant app, we need to resolve organizationId properly.
        // For now, we'll use the first organization found if not provided.
        let orgId = organizationId
        if (!orgId) {
            const org = await prisma.organization.findFirst()
            orgId = org?.id
        }

        if (!orgId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 500 })
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                organizationId: orgId,
                customerEmail: sender,
                subject: subject || 'No Subject',
                status: 'OPEN',
                messages: {
                    create: {
                        sender: 'CUSTOMER',
                        content: content
                    }
                }
            }
        })

        // 2. Check for Auto-Reply Keywords
        const templates = await prisma.responseTemplate.findMany({
            where: {
                organizationId: orgId,
                autoReplyKeywords: { not: null }
            }
        })

        let autoReplied = false
        const lowerContent = (subject + ' ' + content).toLowerCase()

        for (const template of templates) {
            if (!template.autoReplyKeywords) continue

            const keywords = template.autoReplyKeywords.split(',').map(k => k.trim().toLowerCase())
            const match = keywords.some(k => lowerContent.includes(k))

            if (match) {
                // 3. Send Auto-Reply
                console.log(`Auto-replying to ${sender} with template: ${template.title}`)

                await sendEmail({
                    to: sender,
                    subject: `Re: ${subject}`,
                    html: template.content.replace(/\n/g, '<br/>')
                })

                // Log the reply
                await prisma.ticketMessage.create({
                    data: {
                        ticketId: ticket.id,
                        sender: 'SYSTEM',
                        content: `[AUTO-REPLY via "${template.title}"]: \n${template.content}`
                    }
                })

                autoReplied = true
                break // Only send one auto-reply per email to avoid loops/spam
            }
        }

        return NextResponse.json({ success: true, ticketId: ticket.id, autoReplied })

    } catch (error) {
        console.error('Error processing incoming email:', error)
        return NextResponse.json({ error: 'Failed to process email' }, { status: 500 })
    }
}
