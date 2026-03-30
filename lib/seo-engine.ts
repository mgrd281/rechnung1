import { ShopifyAPI, ShopifyProduct } from './shopify-api'
import { getShopifySettings } from './shopify-settings'
import {
    SeoIssue,
    SeoScan,
    SeoScanOptions,
    SeoResourceType,
    SeoSeverity,
    SeoCategory,
    SeoFixType
} from '../types/seo-types'

/**
 * Core engine for scanning and auditing a Shopify store for SEO issues.
 * Expanded for enterprise-grade reporting and AI integration.
 */
export class SEOEngine {
    private shopifyApi: ShopifyAPI

    constructor(organizationId: string) {
        // In a real app, we'd fetch settings specifically for this organization
        const settings = getShopifySettings()
        this.shopifyApi = new ShopifyAPI(settings)
    }

    /**
     * Performs a full store SEO scan based on provided options.
     */
    async performScan(options: SeoScanOptions): Promise<SeoScan> {
        const issues: SeoIssue[] = []
        const startTime = Date.now()

        const scanId = `scan_${Date.now()}`
        const scanResult: SeoScan = {
            id: scanId,
            status: 'running',
            progress: 0,
            crawledUrls: 0,
            totalUrls: 0,
            currentStage: 'crawl',
            options,
            startedAt: new Date().toISOString()
        }

        try {
            // 1. Fetch live Shopify data
            let resources: { type: SeoResourceType, data: any }[] = []

            if (options.scope === 'full' || options.scope === 'products') {
                const products = await this.shopifyApi.getProducts({ limit: 100 })
                resources.push(...products.map(p => ({ type: 'Product' as SeoResourceType, data: p })))
            }

            if (options.scope === 'full' || options.scope === 'collections') {
                const collections = await this.shopifyApi.getCollections({ limit: 50 })
                resources.push(...collections.map(c => ({ type: 'Collection' as SeoResourceType, data: c })))
            }

            scanResult.totalUrls = resources.length
            scanResult.currentStage = 'analyze'

            // 2. Perform deep auditing
            for (let i = 0; i < resources.length; i++) {
                const resource = resources[i]
                const resourceIssues = this.auditResource(resource.type, resource.data)
                issues.push(...resourceIssues)

                scanResult.crawledUrls++
                scanResult.progress = 10 + Math.floor((i / resources.length) * 80)
            }

            // 3. Scoring & Technical Checks
            scanResult.currentStage = 'score'
            const stats = this.calculateStats(issues)

            // Save issues to persistent storage (simplified for this context)
            // In production, this would go to a database table `SeoIssues`

            scanResult.status = 'completed'
            scanResult.currentStage = 'report'
            scanResult.progress = 100
            scanResult.completedAt = new Date().toISOString()
            scanResult.duration = Date.now() - startTime
            scanResult.healthScore = stats.healthScore
            scanResult.criticalErrors = stats.critical
            scanResult.warnings = stats.high + stats.medium
            scanResult.opportunities = stats.low

            return scanResult

        } catch (error) {
            console.error('[SEO-ENGINE] Scan failed:', error)
            scanResult.status = 'failed'
            throw error
        }
    }

    private auditResource(type: SeoResourceType, data: any): SeoIssue[] {
        const issues: SeoIssue[] = []
        const settings = getShopifySettings()
        const baseUrl = `https://${settings.shopDomain}`
        const path = `/${type.toLowerCase()}s/${data.handle || ''}`
        const url = `${baseUrl}${path}`

        // --- TITLE TAG ANALYSIS ---
        const title = data.title || ''
        if (!title) {
            issues.push(this.createIssue(path, 'Fehlender Titel-Tag', 'On-Page', 'Critical', 'auto', 'Fügen Sie einen SEO-Titel hinzu.', type))
        } else if (title.length < 40) {
            issues.push(this.createIssue(path, 'Titel-Tag zu kurz', 'On-Page', 'High', 'auto', `Der Titel ist nur ${title.length} Zeichen lang. Optimieren Sie auf 50-60 Zeichen.`, type))
        } else if (title.length > 70) {
            issues.push(this.createIssue(path, 'Titel-Tag zu lang', 'On-Page', 'Medium', 'auto', 'Der Titel wird in den Suchergebnissen abgeschnitten. Kürzen Sie auf < 70 Zeichen.', type))
        }

        // --- CONTENT ANALYSIS ---
        const bodyContent = data.body_html || ''
        const textOnly = bodyContent.replace(/<[^>]*>?/gm, '').trim()

        if (textOnly.length === 0) {
            issues.push(this.createIssue(path, 'Fehlende Inhaltsbeschreibung', 'Content', 'Critical', 'manual', 'Diese Seite hat keinen Textinhalt. Fügen Sie eine Beschreibung hinzu.', type))
        } else if (textOnly.length < 300) {
            issues.push(this.createIssue(path, 'Dünner Content (Thin Content)', 'Content', 'High', 'manual', 'Wenig Textinhalt schadet dem Ranking. Versuchen Sie min. 600 Zeichen zu erreichen.', type))
        }

        // --- IMAGE ANALYSIS (ALT TAGS) ---
        if (type === 'Product' && data.images) {
            const imagesWithoutAlt = data.images.filter((img: any) => !img.alt || img.alt.trim() === '')
            if (imagesWithoutAlt.length > 0) {
                issues.push(this.createIssue(path, `${imagesWithoutAlt.length} Bilder ohne Alt-Text`, 'Accessibility', 'Medium', 'auto', 'Fehlende Alt-Texte schaden der Bildsuche und Barrierefreiheit.', type))
            }
        }

        // --- URL STRUCTURE ---
        if (data.handle && data.handle.includes('_')) {
            issues.push(this.createIssue(path, 'Unterstriche in URL', 'Technical', 'Low', 'manual', 'Verwenden Sie Bindestriche (-) statt Unterstriche (_) in URLs.', type))
        }

        return issues
    }

    private createIssue(
        url: string,
        title: string,
        category: SeoCategory,
        severity: SeoSeverity,
        fixType: SeoFixType,
        recommendation: string,
        resourceType: SeoResourceType
    ): SeoIssue {
        return {
            id: `iss_${Math.random().toString(36).substr(2, 9)}`,
            url,
            title,
            issue: title,
            category,
            severity,
            fixType,
            status: 'pending',
            impact: severity === 'Critical' ? 10 : severity === 'High' ? 8 : 4,
            recommendation,
            resourceType,
            createdAt: new Date().toISOString()
        }
    }

    private calculateStats(issues: SeoIssue[]) {
        const stats = { critical: 0, high: 0, medium: 0, low: 0 }
        issues.forEach(i => {
            if (i.severity === 'Critical') stats.critical++
            else if (i.severity === 'High') stats.high++
            else if (i.severity === 'Medium') stats.medium++
            else if (i.severity === 'Low') stats.low++
        })

        const healthScore = Math.max(0, 100 - (stats.critical * 12) - (stats.high * 6) - (stats.medium * 2))
        return { ...stats, healthScore }
    }
}
