// ================================================
// PRODUCT INTELLIGENCE PLATFORM - TYPE DEFINITIONS
// ================================================

export type DiscoveryMode = 'manual' | 'auto' | 'website'
export type DemandLevel = 'low' | 'medium' | 'high'
export type ProductStatus = 'new' | 'reviewed' | 'published' | 'rejected'
export type TrendBadge = 'rising' | 'hot' | 'stable' | 'declining'
export type RiskLevel = 'safe' | 'medium' | 'high'
export type CronFrequency = 'hourly' | '6h' | 'daily'

// ================================================
// Product Candidate
// ================================================

export interface ProductCandidate {
    id: string
    organizationId: string

    // Basic Info
    title: string
    description?: string
    brand?: string
    category?: string
    ean?: string
    sourceUrl: string
    images: string[]  // Array of image URLs

    // Pricing
    detectedPrice?: number
    minCompetitorPrice?: number
    avgCompetitorPrice?: number
    maxCompetitorPrice?: number
    suggestedPrice?: number
    estimatedCost?: number

    // Intelligence Scores
    trendScore: number          // 0-100
    demandLevel: DemandLevel
    riskScore: number           // 0-100
    estimatedProfit?: number
    marginPercent?: number
    freshnessScore: number      // 0-100

    // AI Content
    aiTitle?: string
    aiTitleSeo?: string
    aiDescription?: string
    aiBulletPoints?: string[]

    // Metadata
    firstSeen: Date
    lastUpdated: Date
    publishDate?: Date

    // Seasonality
    seasonalityWindow?: string  // "Nov-Dec"
    bestSellingFrom?: Date
    bestSellingTo?: Date

    // Bundle Suggestions
    suggestedBundles?: BundleSuggestion[]

    // Status
    status: ProductStatus
    publishedToShopify: boolean
    shopifyProductId?: string
    rejectionReason?: string

    // Relations
    competitorPrices?: CompetitorPrice[]

    createdAt: Date
    updatedAt: Date
}

// ================================================
// Competitor Price
// ================================================

export interface CompetitorPrice {
    id: string
    productCandidateId: string
    vendor: string           // "Amazon", "Idealo", "Google Shopping"
    price: number
    currency: string
    availability?: string    // "in_stock", "out_of_stock", "limited"
    url: string
    shipping?: number
    scrapedAt: Date
}

// ================================================
// Discovery Job
// ================================================

export interface DiscoveryJob {
    id: string
    organizationId: string

    // Configuration
    mode: DiscoveryMode
    query?: string           // Brand or category
    targetUrl?: string       // For website mode
    categories?: string[]    // For auto mode
    brands?: string[]        // For auto mode
    priceMin?: number
    priceMax?: number
    region?: string          // "DE", "EU"
    freshnessDays: number

    // Scheduling
    isScheduled: boolean
    cronFrequency?: CronFrequency
    nextRunAt?: Date

    // Status
    status: 'pending' | 'running' | 'completed' | 'failed'
    startedAt?: Date
    finishedAt?: Date

    // Results
    queriesGenerated: number
    resultsFound: number
    productsImported: number
    duplicatesSkipped: number
    lowQualitySkipped: number
    errorMessage?: string

    createdAt: Date
    updatedAt: Date
}

// ================================================
// Trend Snapshot
// ================================================

export interface TrendSnapshot {
    id: string
    query: string
    trendValue: number       // 0-100
    searchVolume?: number
    region: string
    capturedAt: Date
}

// ================================================
// Product Intelligence Dashboard
// ================================================

export interface ProductIntelligenceDashboard {
    id: string
    organizationId: string

    // Metrics
    newProductsToday: number
    newProductsWeek: number
    hotTrendsCount: number
    avgMarginPercent?: number
    avgProfitEur?: number
    totalPublished: number

    // Status
    lastCrawlAt?: Date
    nextScheduledCrawl?: Date

    updatedAt: Date
}

// ================================================
// Intelligence Insights
// ================================================

export interface ProductIntelligence {
    trendScore: number
    trendBadge: TrendBadge
    estimatedProfit: number
    marginPercent: number
    demandLevel: DemandLevel
    riskScore: number
    riskLevel: RiskLevel
    competitorPrices: CompetitorPrice[]
    suggestedBundles?: BundleSuggestion[]
    seasonalityWindow?: string
    freshnessScore: number
}

export interface BundleSuggestion {
    productIds: string[]     // IDs of products in bundle
    estimatedProfit: number
    confidence: number       // 0-100
    reason?: string          // "Frequently bought together"
}

// ================================================
// Discovery Configuration
// ================================================

export interface ManualSearchConfig {
    mode: 'manual'
    query: string            // Brand or Category
    priceMin?: number
    priceMax?: number
    region?: string
    freshnessDays: number
}

export interface AutoDiscoveryConfig {
    mode: 'auto'
    categories: string[]
    brands?: string[]
    priceMin?: number
    priceMax?: number
    region?: string
    freshnessDays: number
    cronFrequency: CronFrequency
}

export interface WebsiteImportConfig {
    mode: 'website'
    targetUrl: string
    freshnessDays: number
}

export type DiscoveryConfig = ManualSearchConfig | AutoDiscoveryConfig | WebsiteImportConfig

// ================================================
// API Response Types
// ================================================

export interface DiscoveryJobResponse {
    success: boolean
    jobId?: string
    error?: string
}

export interface ProductCandidatesResponse {
    success: boolean
    products?: ProductCandidate[]
    total?: number
    error?: string
}

export interface DashboardStatsResponse {
    success: boolean
    stats?: ProductIntelligenceDashboard
    error?: string
}

// ================================================
// Filters & Search
// ================================================

export interface ProductFilters {
    status?: ProductStatus[]
    category?: string[]
    brand?: string[]
    minProfit?: number
    minMargin?: number
    maxRisk?: number
    trendBadge?: TrendBadge[]
    demandLevel?: DemandLevel[]
}

export interface ProductSearchParams {
    query?: string
    filters?: ProductFilters
    sortBy?: 'trendScore' | 'estimatedProfit' | 'firstSeen' | 'riskScore'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}
