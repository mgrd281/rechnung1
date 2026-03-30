import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGoogleShoppingSettings } from '@/lib/google-shopping'
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

// Helper to escape XML special characters
function escapeXml(unsafe: string | null | undefined): string {
    if (!unsafe) return ''
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '&': return '&amp;'
            case '\'': return '&apos;'
            case '"': return '&quot;'
            default: return c
        }
    })
}

export async function GET(req: NextRequest) {
    try {
        const settings = await getGoogleShoppingSettings()
        const shopify = new ShopifyAPI()

        // 1. Fetch Reviews
        // Build filter based on settings
        const whereClause: any = {
            status: { in: ['APPROVED', 'PUBLISHED'] } // Assuming APPROVED is the status for visible reviews
        }

        if (settings.filterEmptyComments) {
            whereClause.content = { not: '' }
        }

        // Filter by source if needed (e.g. only verified buyers? settings.filterCustomerReviews)
        // For now, we include all sources unless specific logic is needed.
        // The settings names 'filterCustomerReviews' and 'filterImportedReviews' are a bit ambiguous 
        // (do they mean "include only" or "exclude"?). 
        // Based on the UI checkbox "Customer Reviews" (checked) usually means "Include".
        // So if filterCustomerReviews is FALSE, we might exclude them? 
        // Let's assume the checkboxes mean "Include in feed".

        const sources = []
        if (settings.filterCustomerReviews) sources.push('web', 'email')
        if (settings.filterImportedReviews) sources.push('import', 'loox', 'judgeme', 'amazon')

        if (sources.length > 0) {
            whereClause.source = { in: sources }
        }

        // Keyword filter
        if (settings.keywordFilter) {
            const keywords = settings.keywordFilter.split(',').map((k: string) => k.trim()).filter((k: string) => k)
            if (keywords.length > 0) {
                whereClause.AND = keywords.map((k: string) => ({
                    content: { not: { contains: k, mode: 'insensitive' } }
                }))
            }
        }

        // Country filter
        if (settings.countryFilter && settings.countryFilter !== 'all') {
            whereClause.customer = {
                country: settings.countryFilter.toUpperCase()
            }
        }

        const reviews = await prisma.review.findMany({
            where: whereClause,
            include: {
                customer: true
            }
        })

        if (reviews.length === 0) {
            // Return empty valid feed
            return new NextResponse(generateEmptyFeed(), {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' }
            })
        }

        // 2. Fetch Products from Shopify to get GTIN/MPN/Brand
        // We need to fetch all products that are referenced in the reviews
        const productIds = Array.from(new Set(reviews.map(r => r.productId)))

        // Fetch products in batches or all at once. 
        // Since we don't have a bulk "get by IDs" that is efficient for hundreds of IDs in Shopify API (ids param limit),
        // we will fetch ALL products if the count is reasonable, or batch the IDs.
        // For stability, let's try to fetch all products using pagination.

        const productsMap = new Map<string, any>()

        try {
            // Fetch all products (assuming < 2000 for reasonable timeout)
            // We use a simplified version of getOrders pagination logic here or just getProducts loop
            let pageInfo: string | undefined = undefined
            let hasNext = true

            while (hasNext) {
                // We can't easily use the ShopifyAPI class's getProducts for unlimited pagination 
                // because it doesn't expose the cursor directly in the return.
                // However, we can use the `ids` param if we batch them.
                // Let's batch product IDs in chunks of 50 (Shopify limit)

                // Better approach: Just iterate through the productIds array in chunks
                const chunks = []
                for (let i = 0; i < productIds.length; i += 50) {
                    chunks.push(productIds.slice(i, i + 50))
                }

                await Promise.all(chunks.map(async (chunk) => {
                    try {
                        const products = await shopify.getProducts({ ids: chunk.join(','), limit: 50 })
                        products.forEach(p => productsMap.set(String(p.id), p))
                    } catch (e) {
                        console.error('Failed to fetch batch of products', e)
                    }
                }))

                hasNext = false // We processed all chunks
            }
        } catch (error) {
            console.error('Error fetching products from Shopify:', error)
            // Continue generation even if product fetch fails (will miss GTINs but feed will exist)
        }

        // 3. Generate XML
        const xml = generateFeedXml(reviews, productsMap, settings)

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate' // Cache for 1 hour
            }
        })

    } catch (error) {
        console.error('Error generating Google Shopping Feed:', error)
        // Return a valid empty feed or error XML to avoid breaking Merchant Center completely
        return new NextResponse(generateEmptyFeed(), {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        })
    }
}

function generateEmptyFeed() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.3/product_reviews.xsd">
    <version>2.3</version>
    <aggregator>
        <name>Shop Reviews</name>
    </aggregator>
    <publisher>
        <name>Shop Reviews</name>
    </publisher>
    <reviews></reviews>
</feed>`
}

function generateFeedXml(reviews: any[], productsMap: Map<string, any>, settings: any) {
    const reviewsXml = reviews.map(review => {
        const product = productsMap.get(String(review.productId))

        // Skip if product not found? Or include with minimal data?
        // Google requires product identifiers. If we have absolutely nothing, maybe skip.
        // But we have productTitle from review.

        const reviewId = review.id
        const reviewerName = review.customerName || 'Anonymous'
        const reviewUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'invoice-app.com'}/products/${review.productHandle || 'product'}`
        const timestamp = new Date(review.createdAt).toISOString()

        // Product Identifiers
        let identifiers = ''
        let productUrl = ''
        let productName = escapeXml(review.productTitle)

        if (product) {
            productName = escapeXml(product.title)
            productUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'invoice-app.com'}/products/${product.handle}`

            // Collect all GTINs/MPNs from variants
            const gtins = new Set<string>()
            const mpns = new Set<string>()
            const skus = new Set<string>()
            const brands = new Set<string>()

            if (product.vendor) brands.add(product.vendor)

            product.variants.forEach((v: any) => {
                if (v.barcode) gtins.add(v.barcode)
                if (v.sku) skus.add(v.sku)
                if (v.mpn) mpns.add(v.mpn) // Shopify doesn't have standard MPN field in variant, usually it's SKU or barcode or metafield. 
                // Assuming SKU might be used as MPN if configured
            })

            // Construct Identifiers XML
            if (gtins.size > 0) {
                identifiers += `<gtins>${Array.from(gtins).map(g => `<gtin>${g}</gtin>`).join('')}</gtins>`
            }
            if (mpns.size > 0) {
                identifiers += `<mpns>${Array.from(mpns).map(m => `<mpn>${m}</mpn>`).join('')}</mpns>`
            }
            if (skus.size > 0) {
                identifiers += `<skus>${Array.from(skus).map(s => `<sku>${s}</sku>`).join('')}</skus>`
            }
            if (brands.size > 0) {
                identifiers += `<brands>${Array.from(brands).map(b => `<brand>${escapeXml(b)}</brand>`).join('')}</brands>`
            }
        } else {
            // Fallback if product not found in Shopify (deleted?)
            // Use stored title
            identifiers += `<brands><brand>Unknown</brand></brands>` // Minimal requirement
        }

        return `
        <review>
            <review_id>${reviewId}</review_id>
            <reviewer>
                <name>${escapeXml(reviewerName)}</name>
            </reviewer>
            <review_timestamp>${timestamp}</review_timestamp>
            <title>${escapeXml(review.title || 'Review')}</title>
            <content>${escapeXml(review.content)}</content>
            <review_url type="singleton">${escapeXml(reviewUrl)}</review_url>
            <ratings>
                <overall min="1" max="5">${review.rating}</overall>
            </ratings>
            <products>
                <product>
                    <product_name>${productName}</product_name>
                    <product_url>${escapeXml(productUrl)}</product_url>
                    <product_ids>
                        ${identifiers}
                    </product_ids>
                </product>
            </products>
        </review>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.3/product_reviews.xsd">
    <version>2.3</version>
    <aggregator>
        <name>Shop Reviews</name>
    </aggregator>
    <publisher>
        <name>Shop Reviews</name>
    </publisher>
    <reviews>
${reviewsXml}
    </reviews>
</feed>`
}
