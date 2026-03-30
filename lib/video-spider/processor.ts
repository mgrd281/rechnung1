import { prisma } from '@/lib/prisma';
import { fetchVideoMetadata } from './metadata';
import { verifyVideoWithBrowser } from './browser';
import { VideoSpiderMode, VideoReason, PlayerState } from '@/types/video-spider-types';

export async function processVideoSpiderJob(jobId: string, urls: string[]) {
    const job = await (prisma as any).videoSpiderJob.findUnique({
        where: { id: jobId }
    });

    if (!job) return;

    try {
        await (prisma as any).videoSpiderJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING', startedAt: new Date(), totalUrls: urls.length }
        });

        const concurrency = job.spiderCount || 5;
        const results: any[] = [];
        let processedCount = 0;
        let playableCount = 0;
        let blockedCount = 0;
        let failedCount = 0;

        // Simple concurrency control using a pool of promises
        const pool = new Set();

        for (const url of urls) {
            // Check if job was stopped/cancelled
            const currentJob = await (prisma as any).videoSpiderJob.findUnique({ where: { id: jobId } });
            if (currentJob.status === 'STOPPED') break;

            if (pool.size >= concurrency) {
                await Promise.race(pool);
            }

            const promise = (async () => {
                try {
                    // Stage A: Metadata
                    const meta = await fetchVideoMetadata(url);

                    let resultData: any = {
                        jobId,
                        inputUrl: url,
                        videoId: meta?.videoId || null,
                        title: meta?.title || 'Unknown',
                        channelName: meta?.channelName || 'Unknown',
                        playable: meta?.exists || false,
                        reason: meta?.exists ? 'ok' as VideoReason : 'removed' as VideoReason,
                    };

                    // Stage B: Browser Verification if needed or requested
                    if (!meta?.exists || job.mode === 'PLAY' || job.captureProof) {
                        const browserResult = await verifyVideoWithBrowser(
                            url,
                            job.mode as VideoSpiderMode,
                            job.watchSeconds,
                            job.mute,
                            job.captureProof
                        );

                        resultData = {
                            ...resultData,
                            ...browserResult,
                            // Use browser screenshot if available
                            screenshotUrl: browserResult.screenshotBase64 ? `data:image/png;base64,${browserResult.screenshotBase64}` : null,
                        };
                    }

                    // Save result
                    await (prisma as any).videoSpiderResult.create({
                        data: {
                            ...resultData,
                            watchProgressProgress: resultData.watchProgressSeconds || 0,
                            rawLogs: JSON.stringify(resultData)
                        }
                    });

                    // Update local stats
                    processedCount++;
                    if (resultData.playable) playableCount++;
                    else {
                        blockedCount++;
                    }

                } catch (err) {
                    console.error(`Task failed for URL ${url}:`, err);
                    failedCount++;
                    await (prisma as any).videoSpiderResult.create({
                        data: {
                            jobId,
                            inputUrl: url,
                            playable: false,
                            reason: 'unknown',
                            playerState: 'error'
                        }
                    });
                } finally {
                    // Update job progress every 5 URLs or at completion of each task
                    if (processedCount % 5 === 0 || processedCount === urls.length) {
                        await (prisma as any).videoSpiderJob.update({
                            where: { id: jobId },
                            data: {
                                processedCount,
                                playableCount,
                                blockedCount,
                                failedCount
                            }
                        });
                    }
                }
            })().finally(() => pool.delete(promise));

            pool.add(promise);
        }

        await Promise.all(pool);

        const finalJob = await (prisma as any).videoSpiderJob.findUnique({ where: { id: jobId } });
        if (finalJob.status !== 'STOPPED') {
            await (prisma as any).videoSpiderJob.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    finishedAt: new Date()
                }
            });
        }

    } catch (error: any) {
        console.error('Video Spider Job failed:', error);
        await (prisma as any).videoSpiderJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', errorMessage: error.message, finishedAt: new Date() }
        });
    }
}
