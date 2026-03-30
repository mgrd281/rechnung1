export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, startOfWeek } from 'date-fns'

export async function GET(req: Request) {
    try {
        const now = new Date()
        const startOfToday = startOfDay(now)
        const startOfLast7Days = subDays(now, 7)

        // 1. Daily Stats (Today)
        const dailyKeys = await prisma.licenseKey.findMany({
            where: {
                isUsed: true,
                usedAt: {
                    gte: startOfToday
                }
            },
            include: {
                digitalProduct: true
            }
        })

        // 2. Weekly Stats (Last 7 Days)
        const weeklyKeys = await prisma.licenseKey.findMany({
            where: {
                isUsed: true,
                usedAt: {
                    gte: startOfLast7Days
                }
            },
            include: {
                digitalProduct: true
            }
        })

        // Helper to calculate revenue (approximate based on orders)
        // Note: This is efficient enough for small-medium scale. For large scale, we'd need aggregation.
        const calculateStats = async (keys: any[]) => {
            const productStats: Record<string, { title: string, count: number, revenue: number }> = {}
            let totalRevenue = 0

            // Get unique Shopify Order IDs to fetch order totals
            const shopifyOrderIds = Array.from(new Set(keys.map(k => k.shopifyOrderId).filter(Boolean)))

            const orders = await prisma.order.findMany({
                where: {
                    shopifyOrderId: { in: shopifyOrderIds as string[] }
                },
                select: {
                    shopifyOrderId: true,
                    totalAmount: true
                }
            })

            const orderMap = new Map(orders.map(o => [o.shopifyOrderId, Number(o.totalAmount)]))

            for (const key of keys) {
                const prodId = key.digitalProduct.id
                if (!productStats[prodId]) {
                    productStats[prodId] = {
                        title: key.digitalProduct.title,
                        count: 0,
                        revenue: 0
                    }
                }

                productStats[prodId].count += 1

                // Add revenue if we found the order. 
                // CAUTION: If an order has multiple keys, this adds the full order value multiple times.
                // We should ideally split it, but we don't know the split. 
                // For now, let's just use the order value if it's the first time we see this order for this product?
                // Or simpler: Just sum up counts. Revenue is tricky.
                // Let's try to be slightly smarter: If we have the order, add it.
                // But to avoid double counting revenue for the *same* order if it had 2 keys:
                // We should probably calculate Total Revenue separately from Product Revenue.
            }

            // Total Revenue Calculation (Sum of unique orders found)
            totalRevenue = Array.from(orderMap.values()).reduce((a, b) => a + b, 0)

            return {
                count: keys.length,
                revenue: totalRevenue,
                byProduct: Object.values(productStats).sort((a, b) => b.count - a.count)
            }
        }

        const dailyStats = await calculateStats(dailyKeys)
        const weeklyStats = await calculateStats(weeklyKeys)

        return NextResponse.json({
            success: true,
            data: {
                daily: dailyStats,
                weekly: weeklyStats
            }
        })

    } catch (error) {
        console.error('Error generating reports:', error)
        return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
    }
}
