import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !(session.user as any).organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = (session.user as any).organizationId;
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '7d';

        const daysAgo = range === 'today' ? 0 : range === 'yesterday' ? 1 : range === '30d' ? 30 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        startDate.setHours(0, 0, 0, 0);

        // Get page analytics data
        const pageStats = await prisma.pageAnalytics.findMany({
            where: {
                organizationId,
                date: { gte: startDate }
            },
            orderBy: { totalViews: 'desc' }
        });

        // Aggregate data by URL
        const urlMap = new Map<string, any>();

        pageStats.forEach(stat => {
            if (!urlMap.has(stat.url)) {
                urlMap.set(stat.url, {
                    url: stat.url,
                    totalViews: 0,
                    totalDuration: 0,
                    exitCount: 0,
                    bounceCount: 0,
                    avgLoadTime: 0,
                    slowLoadCount: 0,
                    mobileViews: 0,
                    mobileErrors: 0,
                    loadTimes: []
                });
            }

            const entry = urlMap.get(stat.url)!;
            entry.totalViews += stat.totalViews;
            entry.totalDuration += stat.totalDuration;
            entry.exitCount += stat.exitCount;
            entry.bounceCount += stat.bounceCount;
            entry.slowLoadCount += stat.slowLoadCount;
            entry.mobileViews += stat.mobileViews;
            entry.mobileErrors += stat.mobileErrors;
            if (stat.avgLoadTime > 0) {
                entry.loadTimes.push(stat.avgLoadTime);
            }
        });

        // Calculate final metrics
        const pages = Array.from(urlMap.values()).map(page => {
            const avgLoadTime = page.loadTimes.length > 0
                ? Math.round(page.loadTimes.reduce((a: number, b: number) => a + b, 0) / page.loadTimes.length)
                : 0;

            const exitRate = page.totalViews > 0
                ? Math.round((page.exitCount / page.totalViews) * 100)
                : 0;

            const avgDuration = page.totalViews > 0
                ? Math.round(page.totalDuration / page.totalViews)
                : 0;

            return {
                url: page.url,
                views: page.totalViews,
                avgLoadTime,
                isSlow: avgLoadTime > 3000,
                exitRate,
                avgDuration,
                mobileViews: page.mobileViews,
                mobileErrors: page.mobileErrors,
                hasMobileIssues: page.mobileErrors > 0
            };
        });

        // Sort and categorize
        const slowPages = pages.filter(p => p.isSlow).sort((a, b) => b.avgLoadTime - a.avgLoadTime).slice(0, 10);
        const exitPages = pages.filter(p => p.exitRate > 50).sort((a, b) => b.exitRate - a.exitRate).slice(0, 10);
        const quickExitPages = pages.filter(p => p.avgDuration < 10 && p.avgDuration > 0).sort((a, b) => a.avgDuration - b.avgDuration).slice(0, 10);
        const engagementPages = pages.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 10);
        const mobileIssuePages = pages.filter(p => p.hasMobileIssues).sort((a, b) => b.mobileErrors - a.mobileErrors).slice(0, 10);
        const topPages = pages.sort((a, b) => b.views - a.views).slice(0, 10);

        return NextResponse.json({
            success: true,
            slowPages,
            exitPages,
            quickExitPages,
            engagementPages,
            mobileIssuePages,
            topPages
        });

    } catch (error: any) {
        console.error('[Page Performance API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
