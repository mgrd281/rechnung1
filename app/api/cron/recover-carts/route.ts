import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { headers } from 'next/headers'
import { processAutomatedRecoveries } from '@/lib/abandoned-cart-automation'

// This route should be called by a Cron Job scheduler (e.g., Vercel Cron, GitHub Actions, or external service)
// Recommended frequency: Every 15-30 minutes
export async function GET(req: Request) {
    try {
        // Security: Verify a secret token to prevent unauthorized access
        const authHeader = (await headers()).get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[Cron] Starting professional Abandoned Cart Recovery job...')

        const results = await processAutomatedRecoveries()

        return NextResponse.json({
            success: true,
            ...results
        })

    } catch (error) {
        console.error('[Cron] Error in abandoned cart job:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
