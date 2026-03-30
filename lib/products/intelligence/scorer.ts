// ================================================
// PRODUCT INTELLIGENCE - SCORER
// ================================================

import { DemandLevel, TrendBadge, RiskLevel } from '@/types/product-intelligence'
import { ProductCandidate as EngineCandidate } from '../discovery/engine'

export interface IntelligenceScores {
    trendScore: number
    trendBadge: TrendBadge
    demandLevel: DemandLevel
    riskScore: number
    riskLevel: RiskLevel
    estimatedProfit: number
    marginPercent: number
}

/**
 * Calculate all intelligence scores for a product
 */
export async function calculateIntelligence(
    product: EngineCandidate
): Promise<IntelligenceScores> {

    // Calculate trend score
    const trendScore = await calculateTrendScore(product)
    const trendBadge = getTrendBadge(trendScore)

    // Calculate demand level
    const demandLevel = await estimateDemand(product, trendScore)

    // Calculate risk score
    const riskScore = await calculateRiskScore(product)
    const riskLevel = getRiskLevel(riskScore)

    // Calculate profit estimation
    const { profit, margin } = await estimateProfit(product)

    return {
        trendScore,
        trendBadge,
        demandLevel,
        riskScore,
        riskLevel,
        estimatedProfit: profit,
        marginPercent: margin
    }
}

/**
 * Calculate trend score (0-100)
 * Based on:
 * - Product freshness
 * - Search trends (simulated)
 * - Market velocity
 */
async function calculateTrendScore(product: EngineCandidate): Promise<number> {
    let score = 0

    // Freshness contributes 60%
    score += product.freshnessScore * 0.6

    // Simulate search trend impact (20%)
    const trendMultiplier = Math.random() * 20
    score += trendMultiplier

    // Category momentum (20%)
    const categoryMomentum = getCategoryMomentum(product.category || 'General')
    score += categoryMomentum

    return Math.min(100, Math.round(score))
}

/**
 * Get category momentum score
 */
function getCategoryMomentum(category: string): number {
    // Simulated category trends
    const momentum: Record<string, number> = {
        'Electronics': 18,
        'Fashion': 15,
        'Home & Living': 12,
        'Sports': 14,
        'Beauty': 16,
        'General': 10
    }

    return momentum[category] || 10
}

/**
 * Assign trend badge based on score
 */
function getTrendBadge(score: number): TrendBadge {
    if (score >= 80) return 'hot'
    if (score >= 60) return 'rising'
    if (score >= 40) return 'stable'
    return 'declining'
}

/**
 * Estimate demand level
 */
async function estimateDemand(
    product: EngineCandidate,
    trendScore: number
): Promise<DemandLevel> {
    // High demand if:
    // - High trend score
    // - Known brand
    // - Good price point

    if (trendScore >= 70 && product.brand && product.detectedPrice && product.detectedPrice < 200) {
        return 'high'
    }

    if (trendScore >= 50) {
        return 'medium'
    }

    return 'low'
}

/**
 * Calculate risk score (0-100, higher = more risk)
 */
async function calculateRiskScore(product: EngineCandidate): Promise<number> {
    let risk = 0

    // Price risk (too cheap or too expensive)
    if (product.detectedPrice) {
        if (product.detectedPrice < 10) risk += 30 // Too cheap, quality concerns
        if (product.detectedPrice > 500) risk += 20 // Too expensive, limited market
    }

    // Brand risk (unknown brand = higher risk)
    if (!product.brand || product.brand.length < 3) {
        risk += 25
    }

    // Category risk (simulated)
    const categoryRisk = getCategoryRisk(product.category || 'General')
    risk += categoryRisk

    // Source risk (unknown sources = higher risk)
    if (!product.sourceUrl.includes('amazon') &&
        !product.sourceUrl.includes('idealo') &&
        !product.sourceUrl.includes('google')) {
        risk += 15
    }

    return Math.min(100, risk)
}

/**
 * Get category-specific risk
 */
function getCategoryRisk(category: string): number {
    const risks: Record<string, number> = {
        'Electronics': 10,  // Lower risk, stable market
        'Fashion': 25,      // Higher risk, trends change fast
        'Home & Living': 15,
        'Sports': 18,
        'Beauty': 20,
        'General': 30       // Unknown category = high risk
    }

    return risks[category] || 30
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): RiskLevel {
    if (score <= 30) return 'safe'
    if (score <= 60) return 'medium'
    return 'high'
}

/**
 * Estimate profit and margin
 */
async function estimateProfit(product: EngineCandidate): Promise<{ profit: number; margin: number }> {
    const marketPrice = product.detectedPrice || 0

    if (marketPrice === 0) {
        return { profit: 0, margin: 0 }
    }

    // SIMULATION: In production, would use real cost data
    // Assume cost is 40% of market price
    const estimatedCost = marketPrice * 0.4

    // Calculate fees (15% for platform + payment)
    const fees = marketPrice * 0.15

    // Calculate profit
    const profit = marketPrice - estimatedCost - fees

    // Calculate margin %
    const margin = (profit / marketPrice) * 100

    return {
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 10) / 10
    }
}

/**
 * Refresh intelligence scores for an existing product
 */
export async function refreshIntelligence(productId: string, prisma: any) {
    const product = await prisma.productCandidate.findUnique({
        where: { id: productId }
    })

    if (!product) return

    // Convert to engine format
    const engineProduct: EngineCandidate = {
        title: product.title,
        description: product.description,
        brand: product.brand,
        category: product.category,
        ean: product.ean,
        sourceUrl: product.sourceUrl,
        images: product.images,
        detectedPrice: product.detectedPrice,
        publishDate: product.publishDate,
        freshnessScore: product.freshnessScore
    }

    //Recalculate
    const intelligence = await calculateIntelligence(engineProduct)

    // Update database
    await prisma.productCandidate.update({
        where: { id: productId },
        data: {
            trendScore: intelligence.trendScore,
            demandLevel: intelligence.demandLevel,
            riskScore: intelligence.riskScore,
            estimatedProfit: intelligence.estimatedProfit,
            marginPercent: intelligence.marginPercent
        }
    })

    console.log(`[Intelligence] Refreshed scores for product ${productId}`)
}
