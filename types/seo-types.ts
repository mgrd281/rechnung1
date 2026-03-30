// SEO Command Center Types

export type SeoSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type SeoCategory = 'Technical' | 'On-Page' | 'Content' | 'Performance' | 'Accessibility' | 'Shopify'
export type SeoResourceType = 'Product' | 'Collection' | 'Blog' | 'Page'
export type SeoFixType = 'auto' | 'manual' | 'info'
export type SeoIssueStatus = 'pending' | 'fixed' | 'ignored'
export type SeoScanStatus = 'idle' | 'running' | 'completed' | 'failed'
export type AutopilotMode = 'off' | 'draft' | 'auto'

export interface SeoIssue {
    id: string
    url: string
    title: string
    resourceType: SeoResourceType
    issue: string
    severity: SeoSeverity
    category: SeoCategory
    fixType: SeoFixType
    status: SeoIssueStatus
    impact: number // 1-10
    recommendation?: string
    beforeValue?: string
    afterValue?: string
    createdAt: string
    fixedAt?: string
}

export interface SeoScan {
    id: string
    status: SeoScanStatus
    progress: number // 0-100
    crawledUrls: number
    totalUrls: number
    currentStage: 'crawl' | 'analyze' | 'score' | 'report'
    options: SeoScanOptions
    startedAt: string
    completedAt?: string
    duration?: number // ms
    healthScore?: number
    criticalErrors?: number
    warnings?: number
    opportunities?: number
}

export interface SeoScanOptions {
    scope: 'full' | 'products' | 'collections' | 'blog' | 'custom'
    depth: 'quick' | 'standard' | 'deep'
    coreWebVitals: boolean
    mobileCheck: boolean
    customUrls?: string[]
}

export interface SeoFix {
    id: string
    issueId: string
    url: string
    field: string
    beforeValue: string
    afterValue: string
    appliedAt: string
    appliedBy: 'user' | 'autopilot'
    confidence: number
    rolledBack: boolean
    rollbackAt?: string
}

export interface SeoProductScore {
    id: string
    handle: string
    title: string
    type: 'product' | 'collection'
    score: number
    titleLength: number
    titleOptimal: boolean
    metaQuality: 'good' | 'poor' | 'missing'
    contentDepth: number // word count
    missingAlts: number
    hasSchema: boolean
    lastChecked: string
}

export interface AutopilotConfig {
    mode: AutopilotMode
    confidenceThreshold: number // 0-1
    neverChangePrice: boolean
    preserveBrandNames: boolean
    uniquenessThreshold: number // 0-100
    dailyLimit: number
    protectedPages: string[]
}

export interface SeoStats {
    healthScore: number
    criticalErrors: number
    warnings: number
    opportunities: number
    lastScan?: {
        timestamp: string
        duration: number
        pagesScanned: number
    }
    trend?: {
        dates: string[]
        scores: number[]
    }
}
