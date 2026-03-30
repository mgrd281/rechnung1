import { prisma } from '@/lib/prisma';
import { discoverCandidates } from './crawler';
import { verifyBacklink } from './verifier';
import { BacklinkMode, CrawlLevel, VerifyMode } from '@/types/backlink-types';

export async function processBacklinkJob(jobId: string) {
    const job = await (prisma as any).backlinkJob.findUnique({
        where: { id: jobId }
    });

    if (!job) return;

    try {
        await (prisma as any).backlinkJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING', startedAt: new Date() }
        });

        // Step 1: Discover candidates
        const candidates = await discoverCandidates(job.target, job.mode as BacklinkMode, job.crawlLevel as CrawlLevel);

        await (prisma as any).backlinkJob.update({
            where: { id: jobId },
            data: { candidatesFound: candidates.length }
        });

        let verifiedCount = 0;
        let newCount = 0;
        let lostCount = 0;
        let errorCount = 0;

        // Step 2 & 3: Fetch & Verify
        for (const candidate of candidates) {
            const result = await verifyBacklink(candidate.url, job.target);

            if (result.exists) {
                verifiedCount++;

                // Save/Update backlink
                const sourceDomain = new URL(candidate.url).hostname;
                const targetUrl = job.mode === 'URL' ? job.target : result.resolvedUrl;
                const targetDomain = new URL(job.target.startsWith('http') ? job.target : `https://${job.target}`).hostname;

                const existing = await (prisma as any).backlink.findUnique({
                    where: {
                        organizationId_sourceUrl_targetUrl_anchorText: {
                            organizationId: job.organizationId,
                            sourceUrl: candidate.url,
                            targetUrl: targetUrl,
                            anchorText: result.anchorText
                        }
                    }
                });

                if (!existing) {
                    newCount++;
                }

                await (prisma as any).backlink.upsert({
                    where: {
                        organizationId_sourceUrl_targetUrl_anchorText: {
                            organizationId: job.organizationId,
                            sourceUrl: candidate.url,
                            targetUrl: targetUrl,
                            anchorText: result.anchorText
                        }
                    },
                    update: {
                        status: 'active',
                        lastSeenAt: new Date(),
                        lastVerifiedAt: new Date(),
                        linkType: result.linkType,
                        placement: result.placement,
                        contextSnippet: result.contextSnippet,
                        httpStatus: result.httpStatus
                    },
                    create: {
                        organizationId: job.organizationId,
                        targetDomain,
                        targetUrl,
                        sourceUrl: candidate.url,
                        sourceDomain,
                        anchorText: result.anchorText,
                        linkType: result.linkType,
                        placement: result.placement,
                        status: 'active',
                        httpStatus: result.httpStatus,
                        contextSnippet: result.contextSnippet,
                        lastVerifiedAt: new Date(),
                        firstSeenAt: new Date(),
                        lastSeenAt: new Date()
                    }
                });

                // Update Referring Domain
                await (prisma as any).referringDomain.upsert({
                    where: {
                        organizationId_domain: {
                            organizationId: job.organizationId,
                            domain: sourceDomain
                        }
                    },
                    update: {
                        lastSeenAt: new Date(),
                    },
                    create: {
                        organizationId: job.organizationId,
                        domain: sourceDomain,
                        backlinksCount: 1,
                        linkingPagesCount: 1,
                        firstSeenAt: new Date(),
                        lastSeenAt: new Date()
                    }
                });

            } else {
                errorCount++;
            }

            // Update progress occasionally
            if (verifiedCount % 10 === 0) {
                await (prisma as any).backlinkJob.update({
                    where: { id: jobId },
                    data: { verifiedCount, newCount, lostCount, errorCount }
                });
            }
        }

        await (prisma as any).backlinkJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                finishedAt: new Date(),
                verifiedCount,
                newCount,
                lostCount,
                errorCount
            }
        });

    } catch (error: any) {
        console.error('Job failed:', error);
        await (prisma as any).backlinkJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', errorMessage: error.message, finishedAt: new Date() }
        });
    }
}
