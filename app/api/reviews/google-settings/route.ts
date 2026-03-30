import { NextRequest, NextResponse } from 'next/server'
import { getGoogleShoppingSettings, saveGoogleShoppingSettings } from '@/lib/google-shopping'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await getGoogleShoppingSettings()
        return NextResponse.json(settings)
    } catch (error) {
        console.error('Error fetching Google Shopping settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        await saveGoogleShoppingSettings(body)
        return NextResponse.json({ success: true, settings: body })
    } catch (error) {
        console.error('Error saving Google Shopping settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
