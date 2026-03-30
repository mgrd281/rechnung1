export type BacklinkStatus = 'active' | 'lost' | 'pending_verification'
export type LinkType = 'dofollow' | 'nofollow' | 'sponsored' | 'ugc'
export type LinkPlacement = 'content' | 'sidebar' | 'footer' | 'nav'
export type BacklinkMode = 'DOMAIN' | 'URL'
export type CrawlLevel = 'STANDARD' | 'DEEP'
export type VerifyMode = 'FAST' | 'STRICT'
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface BacklinkJob {
    id: string
    organizationId: string
    target: string
    mode: BacklinkMode
    crawlLevel: CrawlLevel
    verifyMode: VerifyMode
    status: JobStatus
    candidatesFound: number
    verifiedCount: number
    newCount: number
    lostCount: number
    errorCount: number
    errorMessage?: string
    startedAt?: string
    finishedAt?: string
    logs?: any
    createdAt: string
    updatedAt: string
}

export interface Backlink {
    id: string
    organizationId: string
    targetDomain: string
    targetUrl: string
    sourceUrl: string
    sourceDomain: string
    anchorText?: string
    linkType: LinkType
    placement: LinkPlacement
    status: BacklinkStatus
    httpStatus?: number
    confidenceScore: number
    spamRiskScore: number
    contextSnippet?: string
    contentHash?: string
    lastVerifiedAt?: string
    firstSeenAt: string
    lastSeenAt: string
    createdAt: string
    updatedAt: string
}

export interface ReferringDomain {
    id: string
    organizationId: string
    domain: string
    backlinksCount: number
    linkingPagesCount: number
    internalDomainScore: number
    firstSeenAt: string
    lastSeenAt: string
    createdAt: string
    updatedAt: string
}

export interface BacklinkStats {
    totalBacklinks: number
    referringDomains: number
    newLast30Days: number
    lostLast30Days: number
    dofollowPercentage: number
    averageConfidence: number
}
