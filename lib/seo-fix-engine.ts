import { openaiClient } from './openai-client'
import { ShopifyAPI } from './shopify-api'
import { getShopifySettings } from './shopify-settings'

/**
 * Engine for automatically fixing SEO issues using AI.
 */
export class AIAutoFixEngine {
    private shopifyApi: ShopifyAPI

    constructor(organizationId: string) {
        const settings = getShopifySettings()
        this.shopifyApi = new ShopifyAPI(settings)
    }

    /**
     * Fixes a specific meta title issue for a product.
     */
    async optimizeProductTitle(productId: number, currentTitle: string, description: string): Promise<boolean> {
        try {
            const prompt = `Optimiere den SEO-Titel für folgendes Shopify Produkt. 
            Aktueller Titel: ${currentTitle}
            Beschreibung: ${description.substring(0, 300)}
            Regel: Maximale Länge 60 Zeichen, Klick-stark, enthält wichtigste Keywords.
            Gib NUR den optimierten Titel zurück.`

            const optimizedTitle = await openaiClient.generateSEOText(prompt)
            if (!optimizedTitle || optimizedTitle.includes("Mock")) return false

            // Perform live update in Shopify
            const success = await this.shopifyApi.updateProduct(productId, {
                title: optimizedTitle,
                metafields_global_title_tag: optimizedTitle
            })

            if (success) {
                console.log(`[AI-FIX] ✅ Optimized title for ${productId}: ${optimizedTitle}`)
                return true
            }
            return false

        } catch (error) {
            console.error('[AI-FIX] Title optimization failed:', error)
            return false
        }
    }

    /**
     * Generates and updates Alt-Texts for product images using AI.
     */
    async fixMissingAltTexts(productId: number, productTitle: string): Promise<number> {
        try {
            // Fetch product to get images
            const product = await this.shopifyApi.getProduct(productId)
            if (!product || !product.images) return 0

            let fixedCount = 0
            for (const img of product.images) {
                if (!img.alt || img.alt.trim() === '') {
                    const altText = `${productTitle} - Produktbild`
                    // In a more advanced version, we'd use vision AI to describe the image
                    // For now, we use a smart contextual pattern
                    await this.shopifyApi.updateImage(productId, img.id, { alt: altText })
                    fixedCount++
                }
            }
            return fixedCount
        } catch (error) {
            console.error('[AI-FIX] Alt-text fix failed:', error)
            return 0
        }
    }

    /**
     * Automatically fix all high-impact issues for an organization.
     */
    async runAutonomousOptimization(): Promise<number> {
        // This would be called by a cron job or background worker
        // 1. Get issues (scanned recently)
        // 2. Iterate and apply fixes
        return 0 // Fixed count
    }
}
