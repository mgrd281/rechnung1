import { NextRequest, NextResponse } from 'next/server'
import { getMarketingSettings, saveMarketingSettings } from '@/lib/marketing-settings'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await getMarketingSettings()
        return NextResponse.json(settings)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        await saveMarketingSettings(body)
        return NextResponse.json({ success: true, settings: body })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
