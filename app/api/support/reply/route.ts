export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { to, subject, content } = body

        if (!to || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Convert newlines to <br> if content is plain text
        const htmlContent = content.replace(/\n/g, '<br/>')

        await sendEmail({
            to,
            subject: subject || 'Antwort vom Kundensupport',
            html: htmlContent
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error sending reply:', error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
}
