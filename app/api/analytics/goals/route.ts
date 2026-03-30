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

        // Get all goal completions
        const goals = await prisma.goalTracking.findMany({
            where: {
                organizationId,
                timestamp: { gte: startDate }
            },
            include: {
                session: {
                    select: {
                        sourceLabel: true,
                        sourceMedium: true,
                        deviceType: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' }
        });

        // Aggregate by goal type
        const goalsByType = goals.reduce((acc: any, goal) => {
            if (!acc[goal.goalType]) {
                acc[goal.goalType] = {
                    type: goal.goalType,
                    totalCount: 0,
                    totalValue: 0,
                    bySources: new Map(),
                    byDevice: new Map()
                };
            }

            acc[goal.goalType].totalCount++;
            if (goal.goalValue) {
                acc[goal.goalType].totalValue += goal.goalValue;
            }

            // Track by source
            const source = goal.session.sourceLabel || 'Direct';
            const sourceCount = acc[goal.goalType].bySources.get(source) || 0;
            acc[goal.goalType].bySources.set(source, sourceCount + 1);

            // Track by device
            const device = goal.session.deviceType || 'desktop';
            const deviceCount = acc[goal.goalType].byDevice.get(device) || 0;
            acc[goal.goalType].byDevice.set(device, deviceCount + 1);

            return acc;
        }, {});

        // Format for response
        const goalsummary = Object.values(goalsByType).map((g: any) => ({
            type: g.type,
            totalCount: g.totalCount,
            totalValue: g.totalValue,
            avgValue: g.totalValue > 0 ? g.totalValue / g.totalCount : 0,
            topSources: Array.from(g.bySources.entries())
                .map(([source, count]) => ({ source, count }))
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5),
            deviceBreakdown: Array.from(g.byDevice.entries())
                .map(([device, count]) => ({ device, count }))
        }));

        // Get daily timeline
        const dailyGoals = goals.reduce((acc: any, goal) => {
            const dateKey = goal.timestamp.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = { date: dateKey, total: 0, byType: {} };
            }
            acc[dateKey].total++;
            acc[dateKey].byType[goal.goalType] = (acc[dateKey].byType[goal.goalType] || 0) + 1;
            return acc;
        }, {});

        const timeline = Object.values(dailyGoals);

        return NextResponse.json({
            success: true,
            summary: goalsummary,
            timeline,
            totalGoals: goals.length
        });

    } catch (error: any) {
        console.error('[Goals API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
