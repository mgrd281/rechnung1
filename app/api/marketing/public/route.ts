import { NextResponse } from 'next/server'
import { getMarketingSettings } from '@/lib/marketing-settings'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await getMarketingSettings()

        // Only return public settings
        return NextResponse.json({
            exitIntentEnabled: settings.exitIntentEnabled,
            // Add other public settings here if needed
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}
