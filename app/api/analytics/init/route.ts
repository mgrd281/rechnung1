import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await auth()
        // If no session, still return success but with limited tracking
        return NextResponse.json({
            success: true,
            initialized: true,
            trackingId: session?.user?.id || 'anonymous'
        })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
