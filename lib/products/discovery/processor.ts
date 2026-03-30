// ================================================
// PRODUCT DISCOVERY - JOB PROCESSOR
// ================================================

import { prisma } from '@/lib/prisma'
import { DiscoveryEngine } from './engine'
import { ProductCandidate as EngineCandidate } from './engine'
import { calculateIntelligence } from '../intelligence/scorer'

/**
 * Process a discovery job from start to finish
 */
export async function processDiscoveryJob(jobId: string) {
    console.log(`[DiscoveryProcessor] Starting job ${jobId}`)

    const job = await (prisma as any).discoveryJob.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        console.error(`[DiscoveryProcessor] Job ${jobId} not found`)
        return
    }

    try {
        // Update status to RUNNING
        await (prisma as any).discoveryJob.update({
            where: { id: jobId },
            data: {
                status: 'running',
                startedAt: new Date()
            }
        })

        // Configure discovery engine
        const engine = new DiscoveryEngine({
            mode: job.mode,
            query: job.query,
            targetUrl: job.targetUrl,
            priceMin: job.priceMin,
            priceMax: job.priceMax,
            region: job.region || 'DE',
            freshnessDays: job.freshnessDays
        })

        // Execute discovery
        console.log(`[DiscoveryProcessor] Executing ${job.mode} discovery...`)
        const candidates = await engine.discover()
        console.log(`[DiscoveryProcessor] Found ${candidates.length} candidates`)

        await (prisma as any).discoveryJob.update({
            where: { id: jobId },
            data: { resultsFound: candidates.length }
        })

        // Import products into database
        let imported = 0
        let duplicates = 0
        let lowQuality = 0

        for (const candidate of candidates) {
            try {
                const importedCandidate = await importProductCandidate(job.organizationId, candidate)

                if (importedCandidate === 'duplicate') {
                    duplicates++
                } else if (importedCandidate === 'low_quality') {
                    lowQuality++
                } else {
                    imported++
                }
            } catch (error) {
                console.error(`[DiscoveryProcessor] Error importing candidate:`, error)
                lowQuality++
            }
        }

        // Update job with final stats
        await (prisma as any).discoveryJob.update({
            where: { id: jobId },
            data: {
                status: 'completed',
                finishedAt: new Date(),
                productsImported: imported,
                duplicatesSkipped: duplicates,
                lowQualitySkipped: lowQuality
            }
        })

        console.log(`[DiscoveryProcessor] Job ${jobId} completed: ${imported} imported, ${duplicates} duplicates, ${lowQuality} low quality`)

    } catch (error: any) {
        console.error(`[DiscoveryProcessor] Job ${jobId} failed:`, error)

        await (prisma as any).discoveryJob.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                finishedAt: new Date(),
                errorMessage: error.message
            }
        })
    }
}

/**
 * Import a product candidate into the database
 */
async function importProductCandidate(
    organizationId: string,
    candidate: EngineCandidate
): Promise<string | 'duplicate' | 'low_quality'> {

    // Check for duplicates
    const existingByUrl = await (prisma as any).productCandidate.findFirst({
        where: {
            organizationId,
            sourceUrl: candidate.sourceUrl
        }
    })

    if (existingByUrl) {
        console.log(`[Import] Duplicate detected (URL): ${candidate.sourceUrl}`)
        return 'duplicate'
    }

    if (candidate.ean) {
        const existingByEan = await (prisma as any).productCandidate.findFirst({
            where: {
                organizationId,
                ean: candidate.ean
            }
        })

        if (existingByEan) {
            console.log(`[Import] Duplicate detected (EAN): ${candidate.ean}`)
            return 'duplicate'
        }
    }

    // Quality check (only import products with freshness > 50)
    if (candidate.freshnessScore < 50) {
        console.log(`[Import] Low quality (freshness ${candidate.freshnessScore}): ${candidate.title}`)
        return 'low_quality'
    }

    // Calculate intelligence scores
    const intelligence = await calculateIntelligence(candidate)

    // Create product candidate
    const product = await (prisma as any).productCandidate.create({
        data: {
            organizationId,
            title: candidate.title,
            description: candidate.description,
            brand: candidate.brand,
            category: candidate.category,
            ean: candidate.ean,
            sourceUrl: candidate.sourceUrl,
            images: candidate.images,
            detectedPrice: candidate.detectedPrice,
            publishDate: candidate.publishDate,
            freshnessScore: candidate.freshnessScore,
            trendScore: intelligence.trendScore,
            demandLevel: intelligence.demandLevel,
            riskScore: intelligence.riskScore,
            estimatedProfit: intelligence.estimatedProfit,
            marginPercent: intelligence.marginPercent,
            status: 'new'
        }
    })

    console.log(`[Import] Successfully imported: ${product.id} - ${candidate.title}`)
    return product.id
}
