import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processDiscoveryJob } from '@/lib/products/discovery/processor'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        let organizationId = session?.user?.organizationId

        // Fallback: Fetch from DB if session has email but no organizationId
        if (!organizationId && session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { organizationId: true }
            })
            organizationId = user?.organizationId
        }

        if (!organizationId) {
            console.log('[API] Unauthorized: No organizationId found for user', session?.user?.email)
            return NextResponse.json(
                { success: false, error: 'Nicht autorisiert' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            mode,
            query,
            targetUrl,
            categories,
            brands,
            priceMin,
            priceMax,
            region,
            freshnessDays,
            isScheduled,
            cronFrequency
        } = body

        // Validate mode
        if (!['manual', 'auto', 'website'].includes(mode)) {
            return NextResponse.json(
                { success: false, error: 'Ungültiger Modus' },
                { status: 400 }
            )
        }

        // Validate mode-specific requirements
        if (mode === 'manual' && !query) {
            return NextResponse.json(
                { success: false, error: 'Query erforderlich für manuelle Suche' },
                { status: 400 }
            )
        }

        if (mode === 'website' && !targetUrl) {
            return NextResponse.json(
                { success: false, error: 'URL erforderlich für Website-Import' },
                { status: 400 }
            )
        }

        // Create discovery job
        const job = await (prisma as any).discoveryJob.create({
            data: {
                organizationId: organizationId,
                mode,
                query: query || null,
                targetUrl: targetUrl || null,
                categories: categories || null,
                brands: brands || null,
                priceMin: priceMin || null,
                priceMax: priceMax || null,
                region: region || 'DE',
                freshnessDays: freshnessDays || 30,
                isScheduled: isScheduled || false,
                cronFrequency: cronFrequency || null,
                status: 'pending'
            }
        })

        console.log(`[API] Created discovery job: ${job.id} (${mode})`)

        // Process job immediately (awaiting ensures completion before frontend refresh)
        try {
            await processDiscoveryJob(job.id)
        } catch (error) {
            console.error(`[API] Job ${job.id} failed during processing:`, error)
            // We continue to return success because the job was registered, but status will be failed in DB
        }

        return NextResponse.json({
            success: true,
            jobId: job.id
        })

    } catch (error: any) {
        console.error('[API] Error creating discovery job:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

/**
 * GET: Retrieve discovery jobs
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth()

        let organizationId = session?.user?.organizationId

        // Fallback: Fetch from DB if session has email but no organizationId
        if (!organizationId && session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { organizationId: true }
            })
            organizationId = user?.organizationId
        }

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'Nicht autorisiert' },
                { status: 401 }
            )
        }

        const jobs = await (prisma as any).discoveryJob.findMany({
            where: {
                organizationId: organizationId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })

        return NextResponse.json({
            success: true,
            jobs
        })

    } catch (error: any) {
        console.error('[API] Error fetching discovery jobs:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
