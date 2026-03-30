import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        // Simple silent handler for analytics to stop 404s
        const body = await req.json()
        console.log('[Analytics Record]:', body.event || 'generic_event')

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
